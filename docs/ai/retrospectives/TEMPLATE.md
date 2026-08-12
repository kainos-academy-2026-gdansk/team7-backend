# Retrospective — <STORY-ID> <story title>

<!--
Copy to docs/ai/retrospectives/YYYY-MM-DD-<story-id>-<slug>.md
The agent drafts this; a developer reviews and marks each candidate lesson Accepted or Rejected.
Only accepted lessons are promoted into repository memory. Keep it short and honest.
-->

| | |
| ---- | ---- |
| **Story** | `<STORY-ID>` — <title> |
| **Date** | YYYY-MM-DD |
| **Branch / PR** | `<branch>` / #<pr> |
| **Agents used** | plan-user-story / deliver-user-story |
| **Developer** | <name> |

## What was delivered

<One paragraph: the user-visible outcome, plus endpoints, schema changes and files touched.>

## Validation results

| Gate | Result | Notes |
| ---- | ------ | ----- |
| Lint / format (`npm run ci:check`) | pass / fail | |
| Typecheck (`npx tsc --noEmit`) | pass / fail | |
| Unit tests | pass / fail | |
| Integration tests (Testcontainers) | pass / fail / not run | |
| Build (`npm run build`) | pass / fail | |
| Migration on fresh DB | pass / N/A | |
| Manual verification | approved / declined (n rounds) | |
| E2E | N/A | no E2E suite in this repo |

## What went well

- <Something that worked and is worth repeating.>

## What went wrong

- <Problem.> **Root cause:** <why it happened — missing memory, ambiguous story, wrong assumption,
  environment, gap in AGENTS.md.>

## Rework and declines

<Why the developer declined (if they did), what changed in the replan, and whether the cause was an
ambiguous story, a missing convention, or an agent mistake.>

## Time and effort signals

<Planning rounds, question rounds, validation failures before green, manual verification rounds.>

## Candidate lessons

| # | Lesson | Destination | Developer decision |
| - | ------ | ----------- | ------------------ |
| 1 | <one-line, actionable, generalisable> | memory.md / patterns.md / decisions.md / testing.md / AGENTS.md / copilot-instructions.md | Accepted / Rejected |
| 2 | | | |

A lesson qualifies only if it is **durable** (true next month), **actionable** (changes behaviour) and
**general** (not specific to this one story). Everything else stays in this file.

## Proposed memory diff

```diff
<!-- exact lines to add/change in the destination files, for developer approval -->
```

## Follow-ups

- [ ] <Suggested next story, tech debt item, or documentation gap.>
