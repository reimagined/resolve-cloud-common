export function ignoreNotFoundException(error?: Error & { code: string }): void {
  if (
    error != null &&
    (error.code === 'ResourceNotFoundException' ||
      error.code === 'NoSuchEntity' ||
      error.code === 'NotFoundException' ||
      error.code === 'StateMachineDoesNotExist' ||
      error.code === 'NoSuchDistribution' ||
      error.code === 'NoSuchCloudFrontOriginAccessIdentity')
  ) {
    return
  }
  throw error
}
