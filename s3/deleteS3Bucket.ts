import S3 from 'aws-sdk/clients/s3'

import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteS3Bucket = async (
  params: {
    Region: string
    BucketName: string
    IfExists?: boolean
  },
  log: Log = getLog('DELETE-S3-BUCKET')
): Promise<void> => {
  const { Region, BucketName, IfExists = false } = params

  const s3 = new S3({ region: Region })

  try {
    log.debug(`Delete the bucket "${BucketName}"`)

    const deleteBucket = retry(
      s3,
      s3.deleteBucket,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000,
        expectedErrors: ['NoSuchBucket']
      })
    )

    await deleteBucket({
      Bucket: BucketName
    })

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

export default deleteS3Bucket
