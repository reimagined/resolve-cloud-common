export function isAlreadyExistsException(error?: Error & { code: string }): boolean {
  return (
    error != null &&
    (error.code === 'ConflictException' ||
      error.code === 'ResourceConflictException' ||
      error.code === 'EntityAlreadyExists' ||
      error.code === 'BucketAlreadyExists' ||
      error.code === 'UsernameExistsException' ||
      error.code === 'StateMachineAlreadyExists' ||
      error.code === 'DBClusterAlreadyExistsFault' ||
      (error.code === 'InvalidChangeBatch' && error.message?.includes('already exists')))
  )
}
