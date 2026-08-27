import type { LanguagePack } from "../core/types.js";
import { version, words } from "../generated/en.js";

export const english: LanguagePack<"en"> = Object.freeze({
  code: "en",
  name: "English",
  version,
  words,
});
