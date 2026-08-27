import { createDetector as createLanguageDetector } from "./core/detector.js";
import type { DetectorOptions, ProfanityDetector } from "./core/types.js";
import { english } from "./languages/en.js";

/**
 * Creates an immutable English profanity detector.
 *
 * Use `profanity-kit/core` when selecting language packs explicitly.
 *
 * @example
 *   ```ts
 *   const detector = createDetector();
 *   detector.check("some input");
 *   ```;
 */
export function createDetector(
  options: DetectorOptions = {}
): ProfanityDetector<"en"> {
  return createLanguageDetector({ ...options, languages: [english] });
}

export { ProfanityKitError } from "./core/error.js";
export type { ProfanityKitErrorCode } from "./core/error.js";
export type {
  DetectorOptions,
  FilterOptions,
  LanguagePack,
  LanguagePackNormalization,
  ProfanityDetector,
  ProfanityMatch,
} from "./core/types.js";
