import { describe, expect, expectTypeOf, it } from "vitest";

import { createDetector as createCoreDetector } from "./core/index.js";
import type { ProfanityDetector } from "./core/types.js";
import { createDetector } from "./index.js";
import { english } from "./languages/en.js";
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

  it("detects expanded English dictionary entries added in v0.2.0", () => {
    const detector = createDetector();

    expect(detector.check("dickhead")).toBe(true);
    expect(detector.check("bullshit")).toBe(true);
    expect(detector.check("motherfucker")).toBe(true);
    expect(detector.check("cunt")).toBe(true);
    expect(detector.check("wanker")).toBe(true);
    expect(detector.check("twat")).toBe(true);
    expect(detector.check("slut")).toBe(true);
    expect(
      detector
        .findAll("what a crap dumbass move you fucking wanker")
        .map((match) => match.value)
    ).toEqual(["crap", "dumbass", "fucking", "wanker"]);
  });

  it("detects expanded Indonesian dictionary entries added in v0.2.0", () => {
    const detector = createCoreDetector({ languages: [indonesian] });

    expect(detector.check("bajingan")).toBe(true);
    expect(detector.check("brengsek")).toBe(true);
    expect(detector.check("jancuk")).toBe(true);
    expect(detector.check("pukimak")).toBe(true);
    expect(detector.check("kampret")).toBe(true);
    expect(detector.check("ngentot")).toBe(true);
    expect(
      detector
        .findAll("dasar brengsek kampret goblok kau jancuk")
        .map((match) => match.value)
    ).toEqual(["brengsek", "kampret", "goblok", "jancuk"]);
  });

  it("keeps English and Indonesian expanded packs isolated", () => {
    const enDetector = createDetector();
    const idDetector = createCoreDetector({ languages: [indonesian] });

    expect(enDetector.check("brengsek")).toBe(false);
    expect(idDetector.check("bullshit")).toBe(false);

    const mixed = createCoreDetector({ languages: [english, indonesian] });
    expect(mixed.check("brengsek")).toBe(true);
    expect(mixed.check("bullshit")).toBe(true);
  });
});
