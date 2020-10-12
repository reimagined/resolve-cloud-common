export function ignoreNotFoundException(error?: Error & { code: string }): void {
  if (
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
      (error.code === 'InvalidParameterValueException' &&
        error.message.includes('S3 Error Code: PermanentRedirect')) ||
      (error.code === 'InvalidChangeBatch' && error.message.includes('was not found')))
  ) {
    return
  }
  throw error
}
