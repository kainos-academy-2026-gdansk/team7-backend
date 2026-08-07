-- CreateEnum
CREATE TYPE "JobRoleStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "JobRole" (
    "id" SERIAL NOT NULL,
    "roleName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "closingDate" TIMESTAMP(3),
    "status" "JobRoleStatus" NOT NULL,
    "description" TEXT,
    "openPositions" INTEGER,
    "sharePointLink" TEXT,
    "bandId" INTEGER NOT NULL,
    "capabilityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Band" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Band_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capability" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobRole_status_idx" ON "JobRole"("status");

-- CreateIndex
CREATE INDEX "JobRole_capabilityId_idx" ON "JobRole"("capabilityId");

-- CreateIndex
CREATE INDEX "JobRole_bandId_idx" ON "JobRole"("bandId");

-- CreateIndex
CREATE UNIQUE INDEX "Band_name_key" ON "Band"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_name_key" ON "Capability"("name");

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
