# ADR-009 — Licensing and AI-assisted dictionary curation

**Status:** Accepted

## Context

Public availability does not grant permission to copy a word list. Dictionary
quality also requires cultural judgment: a large automatically generated list
can increase false positives and include fabricated or misclassified terms.

## Decision

License project-owned source code under MIT. Use external dictionary data only
when its license is explicit, compatible, and recorded with source, license,
retrieval date, and required attribution. Include third-party notices only when
third-party material is actually distributed.

AI may generate candidate words, but AI output is not a canonical source. Every
published entry must pass human review for meaning, language, normalization,
whole-word suitability, and false-positive risk. Do not prompt a model to copy a
named repository or dataset. Keep candidate data separate from reviewed data.
Record the process as “AI-assisted, human-reviewed” without representing the AI
provider as a dictionary author.

## Technical reasoning

Provider output terms do not guarantee accuracy, uniqueness, or freedom from
third-party claims. Human selection and verification are therefore product and
provenance controls, not ceremonial review. Separating candidates prevents
unreviewed material from entering generated runtime modules.

## Consequences

Initial corpus work requires a review workflow and native-language judgment.
If all distributed data is project-curated, no `THIRD_PARTY_NOTICES.md` is
needed. If a compatible external source is incorporated later, its notice and
metadata become part of the release artifact as required by its license.

## Reconsider when

Legal review, jurisdiction-specific requirements, or a selected dataset license
requires a different data-license structure. This ADR is engineering guidance,
not legal advice.
