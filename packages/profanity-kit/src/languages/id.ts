import type { LanguagePack } from "../core/types.js";

const words = Object.freeze(["goblok", "indonesiansentinel"] as const);

/**
 * Provisional Indonesian language pack.
 *
 * Phase 3 replaces the sentinel corpus with generated, reviewed dictionary
 * data.
 */
export const indonesian: LanguagePack<"id"> = Object.freeze({
  code: "id",
  name: "Indonesian",
  version: "0.0.0",
  words,
});
