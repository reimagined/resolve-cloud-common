export function isNotFoundException(error?: Error & { code: string }): boolean {
  return (
    error != null &&
    (error.code === 'ResourceNotFoundException' ||
      error.code === 'NoSuchEntity' ||
      error.code === 'NotFoundException' ||
      error.code === 'StateMachineDoesNotExist' ||
      error.code === 'DBClusterNotFoundFault' ||
      error.code === 'NoSuchDistribution' ||
      error.code === 'NoSuchCloudFrontOriginAccessIdentity' ||
      error.code === 'NoSuchBucket' ||
      error.code === 'NoSuchBucketPolicy' ||
      error.code === 'NoSuchLifecycleConfiguration' ||
      error.code === 'NoSuchUpload' ||
      error.code === 'NoSuchVersion' ||
      error.code === 'UserNotFoundException' ||
      (error.code === 'InvalidParameterValueException' &&
        error.message.includes('S3 Error Code: PermanentRedirect')) ||
      (error.code === 'InvalidChangeBatch' && error.message.includes('was not found')))
  )
}
