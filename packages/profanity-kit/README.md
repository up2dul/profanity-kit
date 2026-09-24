<p align="center">
  <a href="https://profanity-kit.up2dul.dev">
    <img src="https://raw.githubusercontent.com/up2dul/profanity-kit/main/apps/docs/public/icon.svg" alt="" width="120" height="120">
  </a>
</p>

<h1 align="center">Profanity Kit</h1>

<p align="center">
  A lightweight, multilingual profanity detector for JavaScript and TypeScript.
</p>

<p align="center">
  <a href="https://github.com/up2dul/profanity-kit/actions/workflows/quality.yaml"><img src="https://github.com/up2dul/profanity-kit/actions/workflows/quality.yaml/badge.svg" alt="Quality"></a>
  <a href="https://github.com/up2dul/profanity-kit/blob/main/LICENSE"><img src="https://img.shields.io/github/license/up2dul/profanity-kit" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D22.13.0-339933?logo=node.js&logoColor=white" alt="Node.js 22.13.0 or newer">
  <a href="https://www.npmjs.com/package/profanity-kit"><img src="https://img.shields.io/npm/v/profanity-kit" alt="npm version"></a>
</p>

<p align="center">
  <a href="https://profanity-kit.up2dul.dev">Documentation</a> ·
  <a href="https://profanity-kit.up2dul.dev/playground">Playground</a> ·
  <a href="https://github.com/up2dul/profanity-kit">GitHub</a>
</p>

Profanity Kit is a language-pack-based profanity detection toolkit built for
multilingual applications. Select and combine only the languages you need, or
provide custom packs for specific communities. English and Indonesian packs
are available today.

It provides predictable, synchronous word filtering without a moderation
service or an opaque machine-learning model. It is a deterministic profanity
detection toolkit, not a contextual moderation or toxicity classifier.
Matches are not judgments of intent: some words have ordinary meanings in other
contexts. The Indonesian pack excludes `anjing`, `babi`, `wedus`, `sempak`, and
`setan`, while retaining the profanity-specific form `anjg`. Applications can
add context-dependent terms with their own `blockList`.

## Why Profanity Kit?

- Unicode-aware, whole-word matching
- Built-in English and Indonesian packs, with more languages planned
- Explicit, bundle-friendly multilingual configuration
- Detailed match metadata with source offsets
- Immutable detector configuration
- Synchronous and runtime agnostic
- Zero runtime dependencies

## Available languages

| Language   | Import                       |
| ---------- | ---------------------------- |
| English    | `profanity-kit/languages/en` |
| Indonesian | `profanity-kit/languages/id` |

Language packs can be used independently or combined in one detector. Custom
packs support additional languages and communities.

## Installation

| Package manager | Command                     |
| --------------- | --------------------------- |
| npm             | `npm install profanity-kit` |
| pnpm            | `pnpm add profanity-kit`    |
| Yarn            | `yarn add profanity-kit`    |
| Bun             | `bun add profanity-kit`     |

## Quick start

The root entry point includes the English language pack:

```ts
import { createDetector } from "profanity-kit";

const detector = createDetector();

detector.check("This contains shit"); // true
detector.filter("Hide the shit"); // "Hide the ****"
```

Use the dictionary-free core to combine the built-in English and Indonesian
language packs:

```ts
import { createDetector } from "profanity-kit/core";
import { english } from "profanity-kit/languages/en";
import { indonesian } from "profanity-kit/languages/id";

const detector = createDetector({ languages: [english, indonesian] });

detector.check("This contains shit"); // true
detector.check("Dasar goblok"); // true
```

Load either pack independently when only one language is needed, or supply a
custom language pack for another language or community.

## Learn more

- [Quick Start](https://profanity-kit.up2dul.dev/quick-start)
- [Playground](https://profanity-kit.up2dul.dev/playground)
- [Languages and dictionaries](https://profanity-kit.up2dul.dev/core-concepts/languages)
- [Customization](https://profanity-kit.up2dul.dev/guides/customization)
- [Integrations](https://profanity-kit.up2dul.dev/guides/integrations)
- [API reference](https://profanity-kit.up2dul.dev/api/detector)

## Compatibility

Profanity Kit supports Node.js 22.13.0 or newer and modern browsers under the
Baseline Widely Available policy. It ships as ESM with TypeScript declarations.

## Contributing

Contributions are welcome. Read the
[contribution guide](https://github.com/up2dul/profanity-kit/blob/main/CONTRIBUTING.md)
before opening an issue or pull request.

## License

[MIT](https://github.com/up2dul/profanity-kit/blob/main/LICENSE)
