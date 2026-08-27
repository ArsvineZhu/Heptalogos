export function nodeErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  return typeof error.code === "string" ? error.code : undefined;
}

export function hasNodeErrorCode(error: unknown, code: string): boolean {
  return nodeErrorCode(error) === code;
}
