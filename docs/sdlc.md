# SDLC

## Workflow

- Define scope and acceptance criteria per milestone.
- Design contracts, domain model, and UI flows.
- Implement domain rules and use cases first.
- Add adapters and UI in vertical slices.
- Validate with automated tests and manual UX review.

## Quality gates

- Unit tests for domain rules.
- Integration tests for adapters.
- E2E tests for core journeys (report, browse, subscribe).
- Accessibility review for primary flows.

## Release process

- CI runs lint, typecheck, and tests on PRs.
- Deploy preview for review and smoke testing.
- Tag releases and record changes in `CHANGELOG.md`.
