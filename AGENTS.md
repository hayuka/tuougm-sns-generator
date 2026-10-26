# AGENTS.md — TUOUGM SNS Generator

## Purpose
Build a multi-brand AI-assisted SNS operations platform. TUOUGM is the first operational brand; RE:NA and other brands may be added. The long-term goal is automated planning, content production, scheduling, publishing, analytics, and iterative improvement.

This file defines instructions for coding agents. Product requirements and proposed architecture live in `docs/architecture.md`.

## Principles
- Deliver the smallest verifiable change that meets the approved scope.
- Preserve existing behavior and avoid unrelated refactors.
- Design for multiple brands from the outset, but **do not** implement multi-tenant SaaS, billing, or client isolation until explicitly requested.
- Favor clear, maintainable code and pragmatic abstractions.
- Do not invent product requirements. Ask when a decision materially affects data, cost, security, UX, or external integrations.
- Treat UI/UX as a first-class requirement: clear flows, editable AI outputs, minimal unnecessary steps, accessible responsive interfaces.

## Authority and approval
- The human owner decides product scope, external services, costs, publication policy, and merge/deployment.
- You may inspect code, draft proposals, and run local/offline tests without separate approval.
- **Never** publish to SNS, send messages on behalf of a brand, deploy to production, spend on paid APIs, create external accounts, or change live data without explicit authorization for the specific action.
- Do not assume that `FULL_AUTO` mode is authorized merely because it is part of the roadmap. It requires deliberate enablement per brand and platform, with documented guardrails.

## Repository workflow
1. Read this file, `README.md`, `docs/architecture.md` (if present), and relevant code.
2. Inspect the current branch and working tree. Do not overwrite existing uncommitted work.
3. For nontrivial changes, summarize the approach and affected files before implementing.
4. Use a feature/task branch for changes. Do not push directly to `main`.
5. Keep PRs focused. Explain purpose, changed files, tests run, limitations, and any manual verification required.
6. Do not merge PRs, enable auto-merge, or deploy unless explicitly instructed.
7. Do not add dependencies, frameworks, or infrastructure simply because they are suggested in the architecture draft. Present tradeoffs and obtain a decision first.

## Implementation guidelines
- Separate brand configuration, content sources, content generation, assets, scheduling, publication adapters, and analytics by responsibility.
- Brand-specific configuration must not be hardcoded into shared business logic.
- Keep external platform APIs behind narrow interfaces. Respect API policies, scopes, rate limits, and platform-specific capabilities.
- Model the lifecycle of generated content explicitly. Keep drafts editable and preserve approval and publication history.
- Publishing must be idempotent where practical, with duplicate prevention, retry limits, observable failures, and a kill switch.
- Protect secrets: never commit credentials, log access tokens, or expose server secrets to browsers. Provide `.env.example` with placeholders if needed.
- Validate input, enforce authorization for sensitive operations, and minimize retained personal data.
- Do not claim a feature or test works without evidence. Distinguish automated checks from manual verification.
- Comments should explain intent and non-obvious decisions rather than restating code.

## Automation safety
- Default to `MANUAL` for new brands and social accounts.
- `SEMI_AUTO`: schedule/publish only explicitly approved content.
- `FULL_AUTO`: allow automated generation and publishing only after explicit owner enablement and within configured platform, frequency, budget, content, and escalation policies.
- Always provide an immediate pause/disable mechanism before unattended publication is enabled.
- Never silently retry a potentially successful publish operation; check for duplicates or reconcile remote state first.
- Generated facts, claims, copyrights, and platform rules require validation appropriate to the risk.
- Do not bypass social network API restrictions, automate prohibited scraping, or use unofficial login automation as a substitute for authorized APIs.

## Tests and reporting
- Run relevant checks (format, lint, typecheck, unit/integration tests) when available.
- Include negative/error paths for authentication, API failures, rate limits, duplicate submissions, and scheduled jobs as features are added.
- If tests cannot run because of network/environment restrictions, report that explicitly; never label them passed.
- End each task with: summary, changed files, test results, unverified items, risks, and next step.

## Documentation
- `README.md`: overview and developer setup.
- `AGENTS.md`: agent instructions.
- `docs/architecture.md`: architecture proposal, scope boundaries, domain model, and roadmap.
- Record significant design decisions and changes in docs as the project evolves.

## Current state
The repository is in an initial planning phase. Do not scaffold an application, install dependencies, configure paid services, or connect SNS accounts unless specifically requested. For the first documentation PR, add/update only the agreed documentation files.
