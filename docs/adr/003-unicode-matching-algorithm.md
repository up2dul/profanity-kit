# ADR-003 — Unicode matching algorithm

**Status:** Accepted

## Context

JavaScript `\b` is ASCII-oriented and cannot express the project's Unicode
whole-word contract. A giant regular expression is hard to escape, attribute,
and maintain. Trie or Aho–Corasick structures add complexity before corpus and
benchmark data justify them.

## Decision

Tokenize input in one Unicode-aware pass, then look up each normalized complete
word in a compiled `Map`. Unicode letters, combining marks, and numbers form a
word. Apostrophes, hyphens, underscores, punctuation, and whitespace are
boundaries in the MVP.

Compile normalized dictionary entries once per detector. `check()` exits on the
first match; `findAll()` scans fully; `filter()` reconstructs output from source
segments. Preserve original UTF-16 offsets while replacement length is based on
Unicode code points.

Default normalization is NFC followed by `toLowerCase()`. Language packs may
declaratively select locale-aware casing. Diacritics remain significant.
An allowlist entry suppresses a match under any configured normalization
locale, regardless of pack order.

## Complexity

For dictionary size `D` and input length `N`, detector compilation is `O(D)` and
detection is expected `O(N)` plus map lookups. Memory is `O(D)` per detector.
No global cache is used initially because cache identity, mutation, and lifetime
would add correctness risks before measurements show a need.

## Alternatives considered

- Substring matching creates false positives such as `ass` in `classic`.
- One giant regex creates escaping, backtracking, attribution, and bundle costs.
- Trie/Aho–Corasick may help phrase or substring search, which is outside MVP.

## Consequences

`ass` and `asshole` require separate entries. Pack words and custom list entries
must each be one complete Unicode token. Phrase matching, aggressive leetspeak
handling, and contextual moderation remain unsupported. Boundary, precedence,
and offset behavior are public compatibility contracts covered by tests.

## Reconsider when

Benchmarks with the real dictionaries show the map index misses agreed budgets,
or the product adopts phrases/substrings that materially change the problem.
