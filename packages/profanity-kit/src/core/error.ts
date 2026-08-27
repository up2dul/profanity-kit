/** Stable error codes produced while configuring a detector. */
export type ProfanityKitErrorCode =
  | "INVALID_LANGUAGE_PACK"
  | "EMPTY_LANGUAGE_LIST"
  | "INVALID_DICTIONARY_ENTRY"
  | "INVALID_REPLACEMENT";

/** Describes invalid detector configuration. */
export class ProfanityKitError extends Error {
  readonly code: ProfanityKitErrorCode;

  constructor(code: ProfanityKitErrorCode, message: string) {
    super(message);
    this.name = "ProfanityKitError";
    this.code = code;
  }
}
