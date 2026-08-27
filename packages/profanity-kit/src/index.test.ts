import { describe, expect, expectTypeOf, it } from "vitest";

import { createDetector as createCoreDetector } from "./core/index.js";
import type { ProfanityDetector } from "./core/types.js";
import { createDetector } from "./index.js";
import { indonesian } from "./languages/id.js";

describe("public entry points", () => {
  it("creates the root English convenience detector", () => {
    const detector = createDetector();

    expectTypeOf(detector).toEqualTypeOf<ProfanityDetector<"en">>();
    expect(detector.check("englishsentinel")).toBe(true);
    expect(detector.check("indonesiansentinel")).toBe(false);
  });

  it("keeps core dictionary-free and infers explicit language codes", () => {
    const detector = createCoreDetector({ languages: [indonesian] });

    expectTypeOf(detector).toEqualTypeOf<ProfanityDetector<"id">>();
    expect(detector.check("indonesiansentinel")).toBe(true);
    expect(detector.check("englishsentinel")).toBe(false);
  });

  it("freezes built-in pack data", () => {
    expect(Object.isFrozen(indonesian)).toBe(true);
    expect(Object.isFrozen(indonesian.words)).toBe(true);
  });

  it("matches reviewed entries without substring false positives", () => {
    const detector = createDetector();

    expect(detector.check("this is fucking shit")).toBe(true);
    expect(detector.check("classic assessment remains clean")).toBe(false);
    expect(detector.findAll("ass asshole").map((match) => match.value)).toEqual(
      ["ass", "asshole"]
    );
  });
});
