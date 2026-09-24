# Dictionary sources and review

Each language directory contains the canonical authoring data for one built-in
pack:

- `words.txt` — one NFC-normalized, lowercase whole word per line, sorted by
  Unicode code point.
- `metadata.json` — pack version, source, license, retrieval date, and review
  status.

The initial corpora are project-curated and distributed under the repository's
MIT license. No third-party word list is copied into the package. If an
external source is adopted, its exact license, attribution requirements, and
retrieval date must be recorded before any entries are added.

AI may suggest candidates in a separate, uncommitted review workspace. A
maintainer must verify language, meaning, normalization, whole-word suitability,
and false-positive risk before moving a candidate into `words.txt`. AI output is
never treated as provenance or as a substitute for human review.

Prefer entries whose insulting use is clear without context. Exclude ordinary
literal words whose abusive meaning depends on context, including the reviewed
Indonesian terms `anjing`, `babi`, `wedus`, `sempak`, and `setan`. Retain
profanity-specific altered spellings such as `anjg`. Applications can add
context-dependent terms with their own `blockList`.

The runtime evaluation corpus lives in
`packages/profanity-kit/src/evaluation.test.ts`. Its `match` cases must be
detected, `clean` cases must not match, and `excluded-ambiguous` cases record
neutral uses of words intentionally omitted by the built-in dictionary. That
last label is a curation choice, not a claim that those words can never be
abusive. Keep examples concise, hand-written, and reviewed by a maintainer with
language knowledge; do not treat AI output as corpus provenance. Include both
languages, capitalization, punctuation, Unicode, reviewed variants, embedded
substring negatives, and neutral contexts when adding cases.

Each language pack has an independent semantic version in `metadata.json`:

- Major for a fundamental change to the pack's curation policy or compatibility
  boundary.
- Minor for reviewed word additions or removals.
- Patch for metadata or provenance corrections that do not change the effective
  word set.

Update only the packs whose data changed. Every dictionary contribution must
update its pack version, regenerate the TypeScript module, add a focused test
and a Changeset, and run the dictionary check. The npm package version is
managed separately by Changesets.

Run `pnpm dictionary:generate` after editing source data. Generated modules in
`packages/profanity-kit/src/generated/` are deterministic and must not be
edited manually. CI runs `pnpm dictionary:check` to detect stale output.
