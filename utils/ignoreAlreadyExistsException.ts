export function ignoreAlreadyExistsException(error?: Error & { code: string }): void {
  if (
    error != null &&
    (error.code === 'ConflictException')
  ) {
    return
  }
  throw error
}
