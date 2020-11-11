export function isAlreadyExistsException(error?: Error & { code: string }): boolean {
  return (
    error != null &&
    (error.code === 'ConflictException' ||
      error.code === 'ResourceConflictException' ||
      error.code === 'EntityAlreadyExists' ||
      error.code === 'BucketAlreadyExists' ||
      error.code === 'StateMachineAlreadyExists')
  )
}
