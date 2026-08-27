export interface WordToken {
  readonly value: string;
  readonly start: number;
  readonly end: number;
}

const WORD_PATTERN = /[\p{L}\p{M}\p{N}]+/gu;

export function* tokenize(input: string): Generator<WordToken> {
  for (const match of input.matchAll(WORD_PATTERN)) {
    const start = match.index;
    const value = match[0];

    yield {
      value,
      start,
      end: start + value.length,
    };
  }
}
