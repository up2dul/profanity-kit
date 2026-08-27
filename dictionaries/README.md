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

Run `pnpm dictionary:generate` after editing source data. Generated modules in
`packages/profanity-kit/src/generated/` are deterministic and must not be
edited manually. CI runs `pnpm dictionary:check` to detect stale output.
