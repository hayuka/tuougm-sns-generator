# Architecture Proposal — TUOUGM SNS Generator

**Status:** Draft v0.1 — for review, not an implementation mandate.

## 1. Product vision
A multi-brand AI SNS operations platform that can ingest source content, propose campaigns, generate/edit media and copy, schedule and publish approved posts, analyze outcomes, and improve future recommendations.

**First operational brand:** TUOUGM. **Potential additional brands:** RE:NA and future client brands.

Multi-brand support means independent brand identities and connected social accounts under one management system. It does **not** initially imply separate client organizations, self-service tenancy, billing, or public SaaS access.

## 2. Goals and boundaries
### Goals
- Manage multiple brands from one dashboard.
- Maintain distinct voice, language, content policy, posting cadence, and platform accounts for each brand.
- Connect reusable content sources (initially TUOUGM WordPress, subject to access and requirements).
- Generate editable platform-specific text and eventually media.
- Support approval workflows, scheduling, publishing, error visibility, and analytics.
- Progress from assisted operations to bounded, explicitly enabled full automation.

### Not in the first release
- Public multi-tenant SaaS, billing, or complex enterprise permissions.
- Universal support for all SNS networks from day one.
- Unsupervised publication by default.
- Autonomous copyrighted-media acquisition or scraping that violates service terms.

## 3. Operating modes
| Mode | Behavior | Default |
| --- | --- | --- |
| MANUAL | AI proposes drafts; human reviews and initiates publication | Yes |
| SEMI_AUTO | Human approves drafts; scheduler publishes at approved times | No |
| FULL_AUTO | AI plans, drafts, schedules, and publishes within preapproved brand/platform rules; monitoring and pause controls required | No |

Modes are configured **per brand**, with optional stricter overrides per social account. A mode switch must not retroactively publish pending drafts. Publication requires platform-specific authorization and available official API capabilities.

## 4. Logical architecture
```text
Management UI
    |
Application API / Authentication
    |
    +-- Brand & Social Account Management
    +-- Content Sources / Ingestion
    +-- Asset Library
    +-- Campaign Planning / AI Generation
    +-- Drafts / Review / Approval
    +-- Scheduling / Job Queue
    +-- Publisher Adapters (platform-specific)
    +-- Analytics / Reporting / Recommendations
    |
Database + Asset Storage + Secrets Management
    |
Worker / Scheduler / Observability
```

Separate **development execution** (Codex Cloud) from **production runtime**. Scheduled publication needs persistent hosting, durable jobs, monitoring, and appropriate credential storage; Codex Cloud is not the production scheduler.

## 5. Initial domain model (conceptual)
- **Brand**: name, profile, supported languages, voice, rules, default operating mode, timezone.
- **SocialAccount**: brand, platform, account identifier, scopes, credential reference, status, platform-specific mode override.
- **ContentSource**: brand, source type, configuration, sync status, last sync time.
- **ContentItem**: source reference, title/body/metadata, brand, ingestion state.
- **Asset**: brand, media type, location, ownership/license metadata, transformations.
- **Campaign**: brand, objective, audience, dates, content plan.
- **Post**: brand, campaign, status, source links, approval record.
- **PostVariant**: post, social account/platform, editable text, media, format constraints.
- **Schedule**: post variant, intended publish time, timezone, status.
- **PublicationAttempt**: schedule, idempotency key, platform response ID, status, error, retries.
- **MetricSnapshot**: published post/account, collection time, available platform metrics.
- **AutomationPolicy**: brand/account, allowed topics, posting caps, budget, approval threshold, pause state.

These are conceptual entities, not a finalized database schema. Final keys, constraints, access rules, and retention policies should be designed during implementation planning.

## 6. Content lifecycle
```text
Source / Idea
  -> Proposal
  -> Draft
  -> Review
  -> Approved
  -> Scheduled
  -> Publishing
  -> Published
  -> Metrics collected
  -> Recommendations
```

Support `Rejected`, `Needs revision`, `Failed`, and `Cancelled` branches. Store an audit trail of approval, edits, schedule changes, and publication attempts. Never infer success from a timeout; reconcile with the social platform to avoid duplicate posting.

## 7. Integrations
- **WordPress**: likely first source for articles, releases, tracks, and relevant media; assess REST API data and permissions before coding.
- **AI providers**: use a replaceable adapter for generation; keep prompts, model settings, and budgets configurable and versioned where useful.
- **SNS networks**: evaluate Instagram, Facebook, Threads, and X individually for official publishing APIs, supported account types, app review, permissions, media requirements, analytics access, quotas, and costs. No assumption of feature parity.
- **Analytics**: ingest platform-provided metrics; consider GA4 for downstream website traffic when attribution is available.
- **Media**: preserve rights/usage metadata and platform-specific export formats. AI image/video generation is a later capability and may require paid external services.

## 8. Technology candidates (not yet approved)
- UI: React + TypeScript + Vite.
- API/workers: Node.js + TypeScript.
- Persistent store: PostgreSQL.
- Background jobs: durable queue and scheduler (selection deferred).
- Media: object storage or equivalent (selection deferred).
- Hosting, authentication, observability, and secret storage: to be selected against operating cost and deployment requirements.

Select technologies based on implementation complexity, hosting cost, local reproducibility, and API requirements. Avoid scaffolding before approving the initial MVP and deployment target.

## 9. Security and reliability requirements
- Encrypted credential storage, minimum necessary OAuth scopes, token refresh/revocation handling.
- Brand-level data separation; if client access is introduced, design tenant isolation separately.
- Explicit owner approval for paid operations and first activation of unattended posting.
- Rate limiting, backoff, idempotency, deduplication, retries with bounds, dead-letter/error review.
- Audit logs, execution visibility, emergency pause, and per-account disable controls.
- Moderation and factual/rights review proportionate to content risk.
- Timezone-aware scheduling and daylight-saving handling for global brands.
- Documented retention/deletion for content, tokens, and analytics.

## 10. Delivery phases
1. **Foundation**: confirm MVP, technology choices, repo conventions, basic UI/API/database/auth scaffolding.
2. **Multi-brand & source management**: brands, accounts as records, WordPress ingestion, assets.
3. **Draft generation & approval**: editable platform variants, templates, AI adapter, approval history.
4. **Scheduled publishing**: start with one approved SNS integration; add worker, retries, audit logs, pause control.
5. **Analytics**: platform metrics, optional GA4 attribution, reporting and suggestions.
6. **Bounded FULL_AUTO**: configurable rules, budgets, content guardrails, staged rollout and monitoring.
7. **Additional brands/platforms**: add integrations only when the previous workflow is reliable.

Each phase should have acceptance criteria and a separate reviewable PR series.

## 11. Decisions needed before implementation
1. First SNS platform and account type to support; which official API permissions are available?
2. Initial MVP: text drafts only, or draft + manual publish + WordPress ingestion?
3. Hosting budget and target environment for persistent runtime.
4. Authentication: single operator initially or multiple editors?
5. Preferred AI provider, budget ceilings, and media-generation scope.
6. Whether RE:NA is a separate brand or a sub-brand of TUOUGM in the data model.

Until these decisions are made, implementation should stay at the documentation/planning stage.
