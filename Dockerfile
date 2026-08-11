# syntax=docker/dockerfile:1

########## Stage 0: base image trusting the Zscaler chain ##########
FROM node:22-alpine AS base
# openssl: Prisma engines link against libssl; ca-certificates: system trust store
RUN apk add --no-cache openssl ca-certificates
WORKDIR /app

# The cert is gitignored, so it is absent in CI. package.json is a dummy
# always-present source: COPY fails if every source glob matches nothing.
COPY ["package.json", "KAINOS-ZSCALER*.p7b", "/tmp/certs/"]

# p7b -> full-chain PEM, only when the cert is actually present
RUN mkdir -p /usr/local/share/certs \
    && : > /usr/local/share/certs/zscaler-chain.pem \
    && : > /usr/local/share/ca-certificates/zscaler-chain.crt \
    && for f in /tmp/certs/*.p7b; do \
         [ -e "$f" ] || continue; \
         openssl pkcs7 -inform DER -in "$f" -print_certs -out /usr/local/share/certs/zscaler-chain.pem \
           || openssl pkcs7 -inform PEM -in "$f" -print_certs -out /usr/local/share/certs/zscaler-chain.pem; \
         cp /usr/local/share/certs/zscaler-chain.pem /usr/local/share/ca-certificates/zscaler-chain.crt; \
         update-ca-certificates; \
       done \
    && rm -rf /tmp/certs

# Do NOT set npm's `cafile`: it replaces the whole CA bundle, breaking the
# npm endpoints Zscaler does not intercept. NODE_EXTRA_CA_CERTS appends instead.
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/certs/zscaler-chain.pem


########## Stage 1: install all dependencies (incl. dev) ##########
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci


########## Stage 2: build TypeScript ##########
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
# prisma resolves from node_modules, so no dynamic npx fetch at build time
RUN npx prisma generate && npm run build
# Drop dev dependencies; prisma + @prisma/client are runtime deps and survive
RUN npm prune --omit=dev


########## Stage 3: runtime ##########
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl ca-certificates
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_EXTRA_CA_CERTS=/usr/local/share/certs/zscaler-chain.pem

COPY --from=base /usr/local/share/certs/zscaler-chain.pem /usr/local/share/certs/zscaler-chain.pem
COPY --from=base /usr/local/share/ca-certificates/zscaler-chain.crt /usr/local/share/ca-certificates/zscaler-chain.crt
RUN update-ca-certificates

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node package.json ./

# Winston writes to ./logs at import time; /app itself stays root-owned
RUN mkdir -p /app/logs && chown node:node /app/logs

USER node
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
