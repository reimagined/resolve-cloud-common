export async function ignoreNotFoundException(error?: Error & { code: string }): Promise<void> {
  if (
    error != null &&
    (error.code === 'ResourceNotFoundException' ||
      error.code === 'NoSuchEntity' ||
      error.code === 'NotFoundException' ||
      error.code === 'StateMachineDoesNotExist')
  ) {
    return
  }
  throw error
}
