import { describe, expect, expectTypeOf, it, vi } from "vitest";

import { createDetector } from "./detector.js";
import { ProfanityKitError } from "./error.js";
import type { LanguagePack, ProfanityMatch } from "./types.js";

const english = {
  code: "en",
  name: "English test pack",
  version: "0.0.0-test",
  words: ["ass", "evil", "shared"],
} as const satisfies LanguagePack<"en">;

const indonesian = {
  code: "id",
  name: "Indonesian test pack",
  version: "0.0.0-test",
  words: ["goblok", "shared"],
} as const satisfies LanguagePack<"id">;

describe("createDetector", () => {
  it("matches complete Unicode words without substring false positives", () => {
    const detector = createDetector({ languages: [english] });

    expect(detector.check("ASS!")).toBe(true);
    expect(detector.check("classic asshole")).toBe(false);
    expect(detector.findAll("ass-hole_ass’ass")).toHaveLength(3);
  });

  it("stops check after the first confirmed match", () => {
    const detector = createDetector({ languages: [english] });
    const normalize = vi.spyOn(String.prototype, "normalize");

    expect(detector.check("evil safe safe")).toBe(true);
    expect(normalize).toHaveBeenCalledTimes(1);

    normalize.mockRestore();
  });

  it("normalizes canonically while retaining original UTF-16 offsets", () => {
    const pack = {
      code: "xx",
      name: "Unicode test pack",
      version: "0.0.0-test",
      words: ["ÉVIL"],
    } as const satisfies LanguagePack<"xx">;
    const detector = createDetector({ languages: [pack] });
    const input = "😀 E\u0301VIL, okay";

    expect(detector.findAll(input)).toEqual([
      {
        value: "E\u0301VIL",
        normalized: "évil",
        start: 3,
        end: 8,
        languages: ["xx"],
        source: "dictionary",
      },
    ]);
    expect(input.slice(3, 8)).toBe("E\u0301VIL");
  });

  it("returns repeated occurrences and all dictionary attributions", () => {
    const detector = createDetector({ languages: [english, indonesian] });

    expectTypeOf(detector.findAll("safe")).toEqualTypeOf<
      ProfanityMatch<"en" | "id">[]
    >();

    expect(detector.findAll("shared, goblok, shared")).toEqual([
      {
        value: "shared",
        normalized: "shared",
        start: 0,
        end: 6,
        languages: ["en", "id"],
        source: "dictionary",
      },
      {
        value: "goblok",
        normalized: "goblok",
        start: 8,
        end: 14,
        languages: ["id"],
        source: "dictionary",
      },
      {
        value: "shared",
        normalized: "shared",
        start: 16,
        end: 22,
        languages: ["en", "id"],
        source: "dictionary",
      },
    ]);
  });

  it("applies allowlist and custom blocklist precedence", () => {
    const detector = createDetector({
      languages: [english],
      blockList: ["custom", "evil"],
      allowList: ["evil", "custom"],
    });

    expect(detector.findAll("evil custom ass")).toEqual([
      {
        value: "ass",
        normalized: "ass",
        start: 12,
        end: 15,
        languages: ["en"],
        source: "dictionary",
      },
    ]);

    const customDetector = createDetector({
      languages: [english],
      blockList: ["projectword", "evil"],
    });
    expect(customDetector.findAll("projectword")[0]).toMatchObject({
      languages: [],
      source: "custom",
    });
    expect(customDetector.findAll("evil")[0]).toMatchObject({
      languages: [],
      source: "custom",
    });
  });

  it("filters from original segments with detector and per-call replacements", () => {
    const detector = createDetector({
      languages: [indonesian],
      replacement: "●",
    });

    expect(detector.filter("Dasar GOBLOK, goblok!")).toBe(
      "Dasar ●●●●●●, ●●●●●●!"
    );
    expect(detector.filter("goblok", { replacement: "😀" })).toBe(
      "😀😀😀😀😀😀"
    );
    expect(detector.filter("kalimat aman")).toBe("kalimat aman");
  });

  it("keeps methods callback-safe and exposes an immutable detector", () => {
    const detector = createDetector({ languages: [english] });
    const { check, isClean, findAll, filter } = detector;

    expect(["safe", "evil"].map(check)).toEqual([false, true]);
    expect(["safe", "evil"].filter(isClean)).toEqual(["safe"]);
    expect(findAll("evil")).toHaveLength(1);
    expect(filter("evil")).toBe("****");
    expect(Object.isFrozen(detector)).toBe(true);
  });

  it("snapshots mutable language packs and configuration arrays", () => {
    const words = ["before"];
    const allowList: string[] = [];
    const blockList = ["custom"];
    const pack: LanguagePack<"mutable"> = {
      code: "mutable",
      name: "Mutable test pack",
      version: "0.0.0-test",
      words,
    };
    const detector = createDetector({
      languages: [pack],
      allowList,
      blockList,
    });

    words[0] = "after";
    allowList.push("before", "custom");
    blockList[0] = "changed";

    expect(detector.check("before custom")).toBe(true);
    expect(detector.check("after changed")).toBe(false);
  });

  it("supports declarative locale-aware casing", () => {
    const turkish = {
      code: "tr",
      name: "Turkish test pack",
      version: "0.0.0-test",
      words: ["İSTANBUL"],
      normalization: { caseLocale: "tr" },
    } as const satisfies LanguagePack<"tr">;
    const detector = createDetector({ languages: [turkish] });

    expect(detector.check("istanbul")).toBe(true);
  });

  it("rejects invalid configuration with stable error codes", () => {
    const captureCode = (factory: () => unknown) => {
      try {
        factory();
      } catch (error) {
        expect(error).toBeInstanceOf(ProfanityKitError);
        return (error as ProfanityKitError).code;
      }
      throw new Error("Expected configuration to fail");
    };

    expect(captureCode(() => createDetector({ languages: [] }))).toBe(
      "EMPTY_LANGUAGE_LIST"
    );
    expect(
      captureCode(() =>
        createDetector({ languages: [english], blockList: [" "] })
      )
    ).toBe("INVALID_DICTIONARY_ENTRY");
    expect(
      captureCode(() =>
        createDetector({ languages: [english], replacement: "xx" })
      )
    ).toBe("INVALID_REPLACEMENT");
    expect(
      captureCode(() =>
        createDetector({ languages: [null] } as unknown as Parameters<
          typeof createDetector
        >[0])
      )
    ).toBe("INVALID_LANGUAGE_PACK");
    expect(
      captureCode(() =>
        createDetector({
          languages: [
            {
              ...english,
              normalization: { caseLocale: "not_a_locale" },
            },
          ],
        })
      )
    ).toBe("INVALID_LANGUAGE_PACK");
  });

  it("rejects non-string runtime inputs instead of coercing them", () => {
    const detector = createDetector({ languages: [english] });

    expect(() => detector.check(null as unknown as string)).toThrow(TypeError);
    expect(() => detector.findAll(123 as unknown as string)).toThrow(TypeError);
    expect(() => detector.filter(false as unknown as string)).toThrow(
      TypeError
    );
  });
});
