export function extractErrorStack(error: Error): string | void {
  return error.stack
}
