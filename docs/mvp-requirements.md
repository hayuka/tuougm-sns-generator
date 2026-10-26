# SNS Generator — MVP Requirements v0.1

Status: Proposal for owner approval. This document does not authorize implementation, paid API calls, or publishing.

## Product objective
Provide a single-operator, multi-brand workspace that turns approved source content into editable SNS post drafts and a manageable publishing plan. TUOUGM is the first brand. RE:NA may be modeled as another brand; this classification remains an open decision.

## MVP scope
1. Brand selector and brand profile: display name, description, tone, preferred languages, posting guidelines, timezone, active/inactive state.
2. Content library: manually register links, text excerpts, and asset metadata; list/filter by brand and status. A WordPress REST importer is a follow-on integration, not required for the first vertical slice.
3. Draft generation workflow: select source(s), target platform(s), language and objective; generate draft suggestions through a provider abstraction. Before live AI integration, use a deterministic mock provider. Never silently make billable calls.
4. Editable platform variants: text, hashtags, media references, and platform-specific notes; preserve source attribution and manual edits.
5. Review states: draft, needs_revision, approved, rejected. Only explicitly approved variants may be marked ready for publishing.
6. Editorial calendar: view proposed publication times, manually reschedule, and detect scheduling conflicts. In MVP, calendar entries are plans, not live platform publishing jobs.
7. Overview: counts by brand and status, next planned items, failed actions, and quick actions.
8. Settings: brand guidelines and placeholder social-account records (no OAuth tokens until a separately approved integration).

## Explicit exclusions from initial MVP
- Live SNS posting, background scheduled publishing, and unattended FULL_AUTO.
- OAuth connections, real analytics collection, GA4 integration, automatic WordPress synchronization.
- AI image/video generation, paid AI execution by default, multi-tenant client logins, billing.

## Core workflow
Choose brand -> choose source or add idea -> choose channels/languages -> generate suggestions (mock initially) -> edit variants -> review/approve -> place on calendar -> export/copy for manual publication.

## Core functional requirements
- Every content item, draft, and calendar entry is associated with a brand.
- Switching brand updates all views and must not mix content from another brand.
- A post may contain multiple channel-specific variants with independent review states.
- AI output is always editable; user edits are not overwritten without explicit confirmation.
- A source item can be reused across multiple posts, with visible relationships.
- Changes to approval and calendar entries retain an auditable timestamp/history where feasible.
- Date/time storage is timezone-aware; display uses brand timezone.
- Failure states are visible and retry is user-initiated in the initial MVP.
- Destructive actions require confirmation.
- Never imply an item was published when it was only scheduled in the editorial calendar.

## Suggested acceptance criteria
1. Create two brands and verify their drafts and settings stay separated.
2. Add a TUOUGM content item and produce mock Japanese and English post variants.
3. Edit generated text and confirm changes persist after navigation/reload.
4. Approve one variant, reject another, and confirm independent status tracking.
5. Place an approved variant on the calendar; move it and verify timezone display.
6. Copy/export the approved variant without calling a social platform.
7. Verify error, empty, loading and confirmation states on desktop and mobile widths.
8. Confirm no API key is exposed in browser output or committed to the repository.

## Proposed implementation milestones
M0: Approve requirements and technology/deployment choices.
M1: App shell, navigation, brand management, persistence, responsive UI.
M2: Content library, mock generation, editable variants.
M3: Approval, editorial calendar, copy/export, tests.
M4: Separately approved WordPress ingestion and live AI provider integration.
M5: Separately approved official SNS API integration and publishing safety controls.

## Open decisions
- Which platform should the first generated variants target: Instagram, Threads, Facebook, or X?
- Is RE:NA an independent brand or a TUOUGM sub-brand?
- Is a single operator sufficient for the first release?
- Where should the application run, and what is the acceptable monthly budget?
- Which AI provider and budget limit should be used after mock generation?
