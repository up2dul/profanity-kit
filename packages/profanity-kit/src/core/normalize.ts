export type CaseLocale = string | undefined;

export function normalizeWord(value: string, caseLocale: CaseLocale): string {
  const canonical = value.normalize("NFC");
  return caseLocale === undefined
    ? canonical.toLowerCase()
    : canonical.toLocaleLowerCase(caseLocale);
}
