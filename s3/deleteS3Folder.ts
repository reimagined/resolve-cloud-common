import S3 from 'aws-sdk/clients/s3'

import { retry, Options, getLog, Log, ignoreNotFoundException, maybeThrowErrors } from '../utils'

const deleteS3Folder = async (
  params: {
    Region: string
    BucketName: string
    FolderName: string
    IfExists?: boolean
  },
  log: Log = getLog('DELETE-S3-FOLDER')
): Promise<void> => {
  const { Region, BucketName, FolderName, IfExists = false } = params

  const s3 = new S3({ region: Region })

  try {
    const listObjects = retry(
      s3,
      s3.listObjects,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000,
        expectedErrors: ['NoSuchBucket']
      })
    )
    const deleteObject = retry(
      s3,
      s3.deleteObject,
      Options.Defaults.override({
        expectedErrors: ['NoSuchKey']
      })
    )

    log.debug(`Delete the bucket folder "${BucketName}"`)

    const { Contents = [] } = await listObjects({ Bucket: BucketName })
    const promises: Array<Promise<void>> = []
    const errors: Array<Error> = []

    for (const { Key: FileKey } of Contents) {
      if (FolderName.length > 0 && FileKey != null && FileKey.startsWith(FolderName)) {
        promises.push(
          (async (): Promise<void> => {
            try {
              if (FileKey != null) {
                await deleteObject({
                  Bucket: BucketName,
                  Key: FileKey
                })
              }
            } catch (error) {
              errors.push(error)
            }
          })()
        )
      }
    }

    await Promise.all(promises)

    maybeThrowErrors(errors)

    log.debug(`The bucket "${BucketName}" has been deleted`)
  } catch (error) {
    if (IfExists) {
      log.error(`Skip delete the bucket "${BucketName}"`)
      ignoreNotFoundException(error)
    } else {
      log.error(`Failed to delete the bucket "${BucketName}"`)
      throw error
    }
  }
}

export default deleteS3Folder
