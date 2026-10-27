# SNS Generator — UI / UX Specification v0.1

Status: Wireframe-level proposal, not final visual design.

## UX principles
- The brand is a persistent global context; always show the selected brand.
- Optimize for the primary journey: source -> draft -> edit -> approve -> plan.
- Avoid modal chains and unnecessary page transitions; keep generation and editing in one workspace.
- Make draft, approved, planned and actually published states unambiguous.
- Support responsive layouts, keyboard operation, clear labels, focus states, and actionable errors.

## Navigation
Global header: product name, brand switcher, global status/help, account/settings.
Primary navigation: Overview, Content, Create, Calendar, Settings.
Future (not MVP): Analytics, Automation, Integrations.

## Screen A — Overview
- Brand summary and operating mode (MANUAL in MVP).
- Metric tiles: source items, drafts, needs review, approved, planned.
- Upcoming calendar items and recent activity.
- Primary CTA: Create post.
- Empty state guides first-time setup.

## Screen B — Content (Phase 3)
Content manages saved posts. The earlier source-library proposal is deferred.
- Reuse global brand context; do not duplicate brand selection or put brand IDs in the URL.
- Show one row/card per DraftPost: theme, selected SNS names/icons, two-line body excerpt, updated time, draft status, visible edit action.
- Filter by selected SNS; show that SNS body when filtered. Sort by updated time descending.
- Desktop list and mobile cards from 320px; wrap long titles/URLs and retain keyboard focus indicators.
- `/create` starts/resumes a new scratch; `/create?draft=<postId>` opens an existing post only in the current brand.
- Delete lives under Other, requires confirmation with brand/theme, and keeps the item on failure.
- Distinguish empty library, no filter matches, read failure, delete failure, and unsaved work.
- New creation and update are separate. Theme alone is required; SNS selection and body are optional.
- Save stays in Create with success/time feedback; provide a separate Content link.
- Persist multiple drafts in brand-scoped localStorage v2; preserve v1 data during migration.
- Compare revisions before writes; localStorage does not guarantee atomic concurrent updates.
- Source ingestion, approvals, scheduling and publication are not part of this phase.

## Screen C — Create (primary workspace)
Desktop: three functional areas in a single page:
1. Source & intent: selected source(s), goal, language, channel selection.
2. Draft variants: platform tabs/cards, editable text, hashtags, media references, regenerate action.
3. Review & plan: preview, warnings, approval, proposed date/time, copy/export.
On mobile: stack these areas in order; preserve state when moving between sections.
Use explicit indicators for generated vs edited text. Confirm before regeneration overwrites edits.

## Screen D — Calendar
- Month/week/list views may be staged; list view is sufficient for first milestone.
- Filters by brand, channel, status.
- Calendar item shows planned date/time, variant, approval status and channel.
- Moving an entry must not publish it.
- Conflict and missing-approval warnings.

## Screen E — Settings
- Brand identity, tone, languages, posting guidelines, timezone.
- Social account placeholders with connection status (not connected by default).
- Automation mode visible as MANUAL; SEMI_AUTO and FULL_AUTO clearly marked unavailable until safe implementation and owner approval.

## UI state requirements
Each data screen: loading, empty, success, validation error, network failure.
Each async generation action: in progress, success, failed, cancel/retry when supported.
Confirmations for destructive actions and for overwriting manual edits.
Avoid optimistic success labels for unverified external actions.

## Information architecture and route candidates
/overview
/content
/create
/calendar
/settings
Brand context may be URL-encoded or selected through application state; implementation choice pending. Deep links should preserve brand and relevant item identity.

## Suggested UI acceptance criteria
- A first-time user can create a brand and first draft without documentation.
- User can switch between brands without leaking draft or calendar state.
- Draft editing and approval require no more than one primary workspace.
- Mobile users can complete the full draft-to-calendar flow.
- Buttons, statuses and navigation never imply that a live SNS publication occurred.

## Design decisions to confirm
- Visual language: neutral SaaS UI versus TUOUGM-themed interface (recommend neutral shell with brand accents).
- Initial channel focus and preview fidelity.
- Calendar default view (recommend list for MVP, month view later).
