import type { LanguagePack } from "../core/types.js";
import { version, words } from "../generated/id.js";

export const indonesian: LanguagePack<"id"> = Object.freeze({
  code: "id",
  name: "Indonesian",
  version,
  words,
});
