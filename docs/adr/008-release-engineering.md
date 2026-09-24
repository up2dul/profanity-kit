# ADR-008 — Release engineering and repository workflow

**Status:** Provisional

## Context

Releases need intentional semantic versioning, understandable changelogs,
reproducible validation, and no long-lived npm credential. Dependency updates
must not flood a small project with unrelated pull requests.

## Decision

Use Changesets to record user-visible package version intent in each relevant PR
and to maintain the release PR and changelog. Language-pack data versions are
independent of the npm package version and follow ADR-004. Use Conventional
Commits for PR titles and squash merge so each merged PR becomes one readable
commit. Changesets—not commit parsing—are the source of package version bumps.
Docs-only and internal changes may omit changesets.

Publish through GitHub Actions and npm Trusted Publishing with provenance. Only
the release workflow receives `id-token: write`; no npm token is stored. Pin
Actions to commit SHAs, use least privilege, serialize releases, and require
quality/package/docs checks as applicable.

Use Renovate weekly with related toolchains grouped, major upgrades separated,
a dependency dashboard, and no automerge during MVP. It covers root tooling,
the private docs app, and GitHub Actions without changing the library's
zero-runtime-dependency claim.

## Technical reasoning

Conventional Commits describe engineering history; Changesets describe consumer
impact. Keeping those concerns separate avoids inaccurate automated versioning.
Trusted Publishing removes a reusable secret. Renovate offers the grouping and
policy control needed for exact pins across a monorepo.

## Consequences

Contributors learn one additional small Markdown artifact for user-visible
changes. The v1.0.0 release is published directly, without a prerelease. It
requires the v1 audit acceptance criteria, successful CI quality and package
checks, packed consumer validation, bundle and performance budgets, documentation
checks and build, and a successful Qalbwise integration check against the release
candidate. Qalbwise is a maintainer-owned consumer; validation evidence is its
tested commit and passing production build (plus consumer tests when available),
not a request for third-party feedback.

## Reconsider when

Repository hosting changes, npm Trusted Publishing becomes unavailable, or the
maintenance cost of Changesets exceeds its demonstrated release value.
