import S3 from 'aws-sdk/clients/s3'

import { retry, Options, getLog, Log } from '../utils'

const deleteS3Bucket = async (
  params: {
    Region: string
    BucketName: string
  },
  log: Log = getLog('DELETE-S3-BUCKET')
): Promise<void> => {
  const { Region, BucketName } = params

  const s3 = new S3({ region: Region })

  try {
    log.debug(`Delete the bucket "${BucketName}"`)

    const deleteBucket = retry(
      s3,
      s3.deleteBucket,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000
      })
    )

    await deleteBucket({
      Bucket: BucketName
    })

    log.debug(`The bucket "${BucketName}" has been deleted`)
  } catch (error) {
    log.debug(`Failed to delete the bucket "${BucketName}"`)
    throw error
  }
}

export default deleteS3Bucket
