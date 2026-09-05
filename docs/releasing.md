# Release rehearsal

This runbook proves the release path required by Phase 6. Changesets owns
version intent and changelog generation. GitHub Actions publishes from the
`release.yaml` workflow with npm Trusted Publishing and provenance.

## Normal `next` release

1. Confirm every user-visible change on `main` has a Changeset and run:

   ```sh
   pnpm changeset:status
   pnpm check
   pnpm package:artifact
   pnpm docs:check
   pnpm docs:build
   ```

2. Push `main`. The Release workflow creates or updates the
   `chore(release): version packages` pull request.
3. Review the generated package version and `CHANGELOG.md`. The version must
   contain the `next` prerelease tag while `.changeset/pre.json` is active.
4. Merge the release pull request. The next Release workflow run validates the
   packed artifact, publishes through npm OIDC, creates the Git tag and GitHub
   release, assigns the `next` npm dist-tag, and verifies the exact registry
   version's provenance, signatures, and runtime imports.
5. Record the workflow run, GitHub release, npm version, and integration result
   in the Phase 6 issue.

The GitHub `npm` environment may require reviewer approval. Configure npm's
trusted publisher with these exact values:

- Organization or user: `up2dul`
- Repository: `profanity-kit`
- Workflow filename: `release.yaml`
- Environment: `npm`
- Allowed action: `npm publish`

The publish job is the only job with `id-token: write`. It uses a GitHub-hosted
runner, npm 11.19.1, and no `NODE_AUTH_TOKEN`. Do not add an npm publishing
token to repository secrets.

## One-time package bootstrap

npm requires a package to exist before a trusted publisher can be configured.
Because `profanity-kit` is not published yet, the first prerelease is an
explicit, interactive bootstrap:

1. Let the Release workflow create the first release pull request and check it
   out locally without merging it.
2. Run all commands from the normal release step above, inspect
   `artifacts/profanity-kit-*.tgz`, then publish the version with an npm account
   that has 2FA enabled:

   ```sh
   cd packages/profanity-kit
   npm publish --tag next --provenance=false
   ```

   This is deliberately interactive and creates no reusable npm credential.
   Local publication cannot carry GitHub Actions provenance, so this bootstrap
   version is not the provenance acceptance test.

3. Merge the release pull request. Its publish job should find that version
   already present and make no registry change.
4. Configure the trusted publisher using the exact values above. Then restrict
   traditional publishing access to require 2FA and disallow tokens.
5. Add a patch Changeset describing the rehearsal adjustment. Push and merge
   the resulting release pull request. This second prerelease must publish from
   GitHub Actions and is the Trusted Publishing and provenance acceptance test.

## Registry consumption and evidence

Test the exact registry version in a real application; do not use a workspace,
Git dependency, or local tarball:

```sh
pnpm add profanity-kit@next
pnpm why profanity-kit
npm view profanity-kit@next version dist.tarball dist.integrity
npm view profanity-kit dist-tags --json
npm pack profanity-kit@next --dry-run
npm audit signatures
```

Exercise at least the root English detector and any language entry point used by
the application. Run that application's tests and production build. Confirm:

- the lockfile resolves the same version shown by `npm view`;
- the installed package contains only `dist`, `README.md`, `LICENSE`, and its
  package manifest;
- the npm package page links provenance to `up2dul/profanity-kit` and the
  successful `release.yaml` run;
- the generated `CHANGELOG.md` accurately describes the prerelease;
- the documented `@next` installation commands work; and
- integration feedback, including the application and tested commit, is added
  to the Phase 6 issue.

Do not exit prerelease mode until the integration feedback is resolved and the
stable-release gates in ADR-008 are satisfied. When ready, run
`pnpm changeset pre exit`, commit the result, and use the same release workflow
for the stable version.
