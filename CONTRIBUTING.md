# Contributing to Profanity Kit

## Prerequisites

- Node.js 22.13.0 or newer
- pnpm 11.23.0 through Corepack

## Local setup

```sh
corepack enable
pnpm install
pnpm check
```

`pnpm check` verifies formatting, linting, types, and tests. Lefthook installs
the same checks for commits and pushes during `pnpm install`.

## Commits and changesets

Use Conventional Commit messages, such as `feat: add a detector option` or
`fix(core): preserve original offsets`.

Run `pnpm changeset` for user-visible package changes. Documentation-only and
internal maintenance changes may omit a changeset.

Maintainers should follow the [release rehearsal runbook](docs/releasing.md)
for prerelease versioning, npm Trusted Publishing, and registry verification.

## Dictionary contributions

To change an existing language dictionary:

- Edit `dictionaries/<language>/words.txt` and update its `metadata.json`,
  including the dictionary version.
- Add a focused regression test for the behavior the change addresses.
- Run `pnpm dictionary:generate` and commit the updated generated file.
- Add a changeset because dictionary changes affect package behavior.

To add a new language pack:

- Create `dictionaries/<language>/words.txt` and `metadata.json`.
- Run `pnpm dictionary:generate` to create the generated module.
- Add `packages/profanity-kit/src/languages/<language>.ts` and expose it in
  `packages/profanity-kit/package.json`.
- Add tests for importing the pack, detecting a representative entry, and
  keeping it isolated from other language packs.
- Document the new import path in the relevant package README and docs.
- Add a changeset.

Do not edit files in `packages/profanity-kit/src/generated/` manually. See
[`dictionaries/README.md`](dictionaries/README.md) for dictionary formatting,
review, and provenance requirements. Run `pnpm check` before submitting the
change.

## Pull requests

- Keep each pull request focused and explain the behavior it changes.
- Add tests for observable behavior.
- Run `pnpm check` before requesting review.
- Document relevant architectural tradeoffs and flag conflicts with an ADR.

By contributing, you agree that your contributions are licensed under the MIT
License.
