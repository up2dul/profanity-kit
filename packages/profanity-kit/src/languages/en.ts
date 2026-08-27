import type { LanguagePack } from "../core/types.js";

const words = Object.freeze(["ass", "englishsentinel"] as const);

/**
 * Provisional English language pack.
 *
 * Phase 3 replaces the sentinel corpus with generated, reviewed dictionary
 * data.
 */
export const english: LanguagePack<"en"> = Object.freeze({
  code: "en",
  name: "English",
  version: "0.0.0",
  words,
});
