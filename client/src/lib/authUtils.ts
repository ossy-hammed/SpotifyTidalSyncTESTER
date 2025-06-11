export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith("401");
}
