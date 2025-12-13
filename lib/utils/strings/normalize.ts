const NON_WORD_CHARACTERS = /[^\p{L}\p{N}''-]+/gu;

export function normalizeWord(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(NON_WORD_CHARACTERS, "");
}

export function isMeaningfulWord(value: string | null | undefined): boolean {
  return normalizeWord(value).length > 0;
}
