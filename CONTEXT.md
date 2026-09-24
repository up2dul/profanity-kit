# Profanity Kit context

Profanity Kit is a TypeScript workspace for building and documenting the `profanity-kit` package.

## Glossary

- **Profanity detection toolkit** — the product category: matching mechanisms,
  language dictionaries, and customization primitives. It is not a complete
  moderation policy or universal source of truth.
- **Language pack** — a versioned, readonly collection of whole-word entries
  for one language or community, selected explicitly by a detector.
- **Pack data version** — the independent semantic version of one language
  pack's reviewed word data and curation policy.
- **Dictionary** — the word data contained by a language pack; dictionaries are
  reviewed defaults and may be overridden by application rules.
- **Ambiguous dictionary word** — a word with a common ordinary meaning whose
  offensive use depends on context; built-in packs omit these unless the form is
  specifically used as profanity or evasion.
- **Evaluation case** — a reviewed example labeled as an expected match, clean
  text, or a neutral use of an intentionally excluded ambiguous word.
- **Allowlist** — entries that remain permitted and take precedence over both
  blocklist entries and language dictionaries across all configured packs.
- **Blocklist** — application-specific whole-word entries added to a detector.

## Context boundaries

This repository uses one shared product context across the library in `packages/profanity-kit` and the documentation application in `apps/docs`.

## Decisions

Architectural decisions are recorded in `docs/adr/`.
