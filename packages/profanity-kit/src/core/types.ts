/** Configuration shared by all detector factories. */
export interface DetectorOptions {
  /** Additional whole-word entries blocked for this detector. */
  readonly blockList?: readonly string[];
  /** Entries that remain allowed, including language-pack entries. */
  readonly allowList?: readonly string[];
  /** Single Unicode code point used by `filter()`. Defaults to `"*"`. */
  readonly replacement?: string;
}

/** Declarative normalization settings for a language pack. */
export interface LanguagePackNormalization {
  /** Locale passed to `toLocaleLowerCase()` during matching. */
  readonly caseLocale?: string;
}

/** A versioned collection of words associated with one language. */
export interface LanguagePack<TCode extends string = string> {
  readonly code: TCode;
  readonly name: string;
  readonly version: string;
  readonly words: readonly string[];
  readonly normalization?: LanguagePackNormalization;
}

/** Configuration for the dictionary-free detector factory. */
export interface LanguageDetectorOptions<
  TLanguages extends readonly LanguagePack[],
> extends DetectorOptions {
  /** Active language packs. At least one pack is required. */
  readonly languages: TLanguages;
}

/** Options that override filtering behavior for one call. */
export interface FilterOptions {
  /** Single Unicode code point used instead of the detector default. */
  readonly replacement?: string;
}

/** A detected whole-word occurrence in the original input. */
export interface ProfanityMatch<TLanguage extends string = string> {
  readonly value: string;
  readonly normalized: string;
  /** Inclusive UTF-16 code-unit offset. */
  readonly start: number;
  /** Exclusive UTF-16 code-unit offset. */
  readonly end: number;
  readonly languages: readonly TLanguage[];
  readonly source: "dictionary" | "custom";
}

/** Immutable, callback-safe profanity detector. */
export interface ProfanityDetector<TLanguage extends string = string> {
  /** Returns `true` as soon as the first match is found. */
  readonly check: (input: string) => boolean;
  /** Returns `true` when the input contains no matches. */
  readonly isClean: (input: string) => boolean;
  /** Returns every occurrence in source order, including duplicates. */
  readonly findAll: (input: string) => ProfanityMatch<TLanguage>[];
  /** Replaces every match while preserving all unmatched input. */
  readonly filter: (input: string, options?: FilterOptions) => string;
}

/** Extracts the language-code union from a language-pack tuple. */
export type LanguageCodeOf<TPack extends LanguagePack> = TPack["code"];
