import { describe, expect, it } from "vitest";

import { createDetector as createCoreDetector } from "./core/index.js";
import type { ProfanityDetector } from "./core/types.js";
import { createDetector } from "./index.js";
import { indonesian } from "./languages/id.js";

type EvaluationCase = {
  readonly language: "en" | "id";
  readonly category: "match" | "clean" | "excluded-ambiguous";
  readonly text: string;
};

// Maintainer-reviewed examples. See dictionaries/README.md for review guidance.
const corpus: readonly EvaluationCase[] = [
  { language: "en", category: "match", text: "You are a SHIT!" },
  { language: "en", category: "match", text: "That was bullshit." },
  { language: "en", category: "match", text: "😀 fuck the update" },
  { language: "en", category: "clean", text: "The café is open." },
  {
    language: "en",
    category: "clean",
    text: "The classic assessment is complete.",
  },
  { language: "id", category: "match", text: "DASAR GOBLOK!" },
  { language: "id", category: "match", text: "Kamu anjg banget." },
  { language: "id", category: "clean", text: "Kucing itu tidur." },
  {
    language: "id",
    category: "excluded-ambiguous",
    text: "Anjing itu sedang tidur.",
  },
  {
    language: "id",
    category: "excluded-ambiguous",
    text: "Babi makan di kandang.",
  },
  {
    language: "id",
    category: "excluded-ambiguous",
    text: "Wedus merumput di ladang.",
  },
  {
    language: "id",
    category: "excluded-ambiguous",
    text: "Sempak itu belum kering.",
  },
  {
    language: "id",
    category: "excluded-ambiguous",
    text: "Setan muncul dalam dongeng itu.",
  },
];

describe("reviewed dictionary evaluation corpus", () => {
  const detectors: Readonly<Record<"en" | "id", ProfanityDetector>> = {
    en: createDetector(),
    id: createCoreDetector({ languages: [indonesian] }),
  };

  it.each(corpus)("$language $category: $text", (example) => {
    expect(detectors[example.language].check(example.text)).toBe(
      example.category === "match"
    );
  });
});
