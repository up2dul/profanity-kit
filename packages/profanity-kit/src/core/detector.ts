import { ProfanityKitError } from "./error.js";
import { normalizeWord, type CaseLocale } from "./normalize.js";
import { tokenize, type WordToken } from "./tokenize.js";
import type {
  FilterOptions,
  LanguageCodeOf,
  LanguageDetectorOptions,
  LanguagePack,
  ProfanityDetector,
  ProfanityMatch,
} from "./types.js";

const DEFAULT_REPLACEMENT = "*";

interface CompiledEntry<TLanguage extends string> {
  readonly normalized: string;
  readonly languages: readonly TLanguage[];
  readonly source: "dictionary" | "custom";
}

interface NormalizationIndex<TLanguage extends string> {
  readonly caseLocale: CaseLocale;
  readonly entries: ReadonlyMap<string, CompiledEntry<TLanguage>>;
  readonly allowed: ReadonlySet<string>;
}

function configurationError(
  code: ConstructorParameters<typeof ProfanityKitError>[0],
  message: string
): never {
  throw new ProfanityKitError(code, message);
}

function validateDictionaryEntry(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    configurationError(
      "INVALID_DICTIONARY_ENTRY",
      `${label} entries must be non-empty strings`
    );
  }

  return value;
}

function validateReplacement(value: unknown): string {
  if (typeof value !== "string" || Array.from(value).length !== 1) {
    configurationError(
      "INVALID_REPLACEMENT",
      "replacement must contain exactly one Unicode code point"
    );
  }

  return value;
}

function validateLanguagePack(value: unknown, index: number): LanguagePack {
  if (typeof value !== "object" || value === null) {
    configurationError(
      "INVALID_LANGUAGE_PACK",
      `languages[${index}] must be a language pack`
    );
  }

  const pack = value as Partial<LanguagePack>;
  if (
    typeof pack.code !== "string" ||
    pack.code.trim().length === 0 ||
    typeof pack.name !== "string" ||
    pack.name.trim().length === 0 ||
    typeof pack.version !== "string" ||
    pack.version.trim().length === 0 ||
    !Array.isArray(pack.words) ||
    (pack.normalization !== undefined &&
      (typeof pack.normalization !== "object" ||
        pack.normalization === null ||
        (pack.normalization.caseLocale !== undefined &&
          (typeof pack.normalization.caseLocale !== "string" ||
            pack.normalization.caseLocale.trim().length === 0))))
  ) {
    configurationError(
      "INVALID_LANGUAGE_PACK",
      `languages[${index}] is not a valid language pack`
    );
  }

  const caseLocale = pack.normalization?.caseLocale;
  if (caseLocale !== undefined) {
    try {
      Intl.getCanonicalLocales(caseLocale);
    } catch {
      configurationError(
        "INVALID_LANGUAGE_PACK",
        `languages[${index}] has an invalid case locale`
      );
    }
  }

  return pack as LanguagePack;
}

function validateDictionaryList(
  value: unknown,
  label: string
): readonly string[] {
  if (!Array.isArray(value)) {
    configurationError(
      "INVALID_DICTIONARY_ENTRY",
      `${label} must be an array of strings`
    );
  }

  return value.map((entry, index) =>
    validateDictionaryEntry(entry, `${label}[${index}]`)
  );
}

function localeKey(caseLocale: CaseLocale): string {
  return caseLocale ?? "";
}

function compileIndexes<TLanguage extends string>(
  languages: readonly LanguagePack<TLanguage>[],
  blockList: readonly string[],
  allowList: readonly string[]
): readonly NormalizationIndex<TLanguage>[] {
  const locales = new Map<string, CaseLocale>();
  locales.set(localeKey(undefined), undefined);
  for (const language of languages) {
    const caseLocale = language.normalization?.caseLocale;
    locales.set(localeKey(caseLocale), caseLocale);
  }

  return [...locales.values()].map((caseLocale) => {
    const allowed = new Set(
      allowList.map((entry) => normalizeWord(entry, caseLocale))
    );
    const custom = new Set(
      blockList.map((entry) => normalizeWord(entry, caseLocale))
    );
    const dictionaryLanguages = new Map<string, TLanguage[]>();

    languages.forEach((language, languageIndex) => {
      if (
        localeKey(language.normalization?.caseLocale) !== localeKey(caseLocale)
      ) {
        return;
      }

      language.words.forEach((entry, wordIndex) => {
        const normalized = normalizeWord(
          validateDictionaryEntry(
            entry,
            `languages[${languageIndex}].words[${wordIndex}]`
          ),
          caseLocale
        );
        const codes = dictionaryLanguages.get(normalized) ?? [];
        if (!codes.includes(language.code)) {
          codes.push(language.code);
        }
        dictionaryLanguages.set(normalized, codes);
      });
    });

    const entries = new Map<string, CompiledEntry<TLanguage>>();
    for (const [normalized, languageCodes] of dictionaryLanguages) {
      if (!allowed.has(normalized)) {
        entries.set(normalized, {
          normalized,
          languages: Object.freeze([...languageCodes]),
          source: "dictionary",
        });
      }
    }
    for (const normalized of custom) {
      if (!allowed.has(normalized)) {
        entries.set(normalized, {
          normalized,
          languages: Object.freeze([]),
          source: "custom",
        });
      }
    }

    return { caseLocale, entries, allowed };
  });
}

function requireString(input: unknown): asserts input is string {
  if (typeof input !== "string") {
    throw new TypeError("input must be a string");
  }
}

function findEntry<TLanguage extends string>(
  token: WordToken,
  indexes: readonly NormalizationIndex<TLanguage>[]
): CompiledEntry<TLanguage> | undefined {
  let found: CompiledEntry<TLanguage> | undefined;

  for (const index of indexes) {
    const normalized = normalizeWord(token.value, index.caseLocale);
    if (index.allowed.has(normalized)) {
      return undefined;
    }

    const candidate = index.entries.get(normalized);
    if (candidate === undefined) {
      continue;
    }
    if (candidate.source === "custom") {
      return candidate;
    }
    if (found === undefined) {
      found = candidate;
      continue;
    }

    const languages = [...found.languages];
    for (const code of candidate.languages) {
      if (!languages.includes(code)) {
        languages.push(code);
      }
    }
    found = { ...found, languages: Object.freeze(languages) };
  }

  return found;
}

/**
 * Creates an immutable detector from explicit language packs.
 *
 * Configuration and language-pack words are compiled and snapshotted once.
 * Invalid configuration throws synchronously.
 */
export function createDetector<
  const TLanguages extends readonly LanguagePack[],
>(
  options: LanguageDetectorOptions<TLanguages>
): ProfanityDetector<LanguageCodeOf<TLanguages[number]>> {
  if (!Array.isArray(options?.languages)) {
    configurationError("INVALID_LANGUAGE_PACK", "languages must be an array");
  }
  if (options.languages.length === 0) {
    configurationError("EMPTY_LANGUAGE_LIST", "languages must not be empty");
  }

  const languages = options.languages.map(validateLanguagePack) as LanguagePack<
    LanguageCodeOf<TLanguages[number]>
  >[];
  const blockList = validateDictionaryList(
    options.blockList ?? [],
    "blockList"
  );
  const allowList = validateDictionaryList(
    options.allowList ?? [],
    "allowList"
  );
  const replacement = validateReplacement(
    options.replacement ?? DEFAULT_REPLACEMENT
  );
  const indexes = compileIndexes(languages, blockList, allowList);

  const check = (input: string): boolean => {
    requireString(input);
    for (const token of tokenize(input)) {
      if (findEntry(token, indexes) !== undefined) {
        return true;
      }
    }
    return false;
  };

  const findAll = (
    input: string
  ): ProfanityMatch<LanguageCodeOf<TLanguages[number]>>[] => {
    requireString(input);
    const matches: ProfanityMatch<LanguageCodeOf<TLanguages[number]>>[] = [];
    for (const token of tokenize(input)) {
      const entry = findEntry(token, indexes);
      if (entry !== undefined) {
        matches.push({
          value: token.value,
          normalized: entry.normalized,
          start: token.start,
          end: token.end,
          languages: entry.languages,
          source: entry.source,
        });
      }
    }
    return matches;
  };

  const filter = (input: string, filterOptions: FilterOptions = {}): string => {
    requireString(input);
    const callReplacement = validateReplacement(
      filterOptions.replacement ?? replacement
    );
    const matches = findAll(input);
    if (matches.length === 0) {
      return input;
    }

    const segments: string[] = [];
    let cursor = 0;
    for (const match of matches) {
      segments.push(input.slice(cursor, match.start));
      segments.push(callReplacement.repeat(Array.from(match.value).length));
      cursor = match.end;
    }
    segments.push(input.slice(cursor));
    return segments.join("");
  };

  return Object.freeze({
    check,
    isClean: (input: string) => !check(input),
    findAll,
    filter,
  });
}
