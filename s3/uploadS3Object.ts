import S3 from 'aws-sdk/clients/s3'
import { Writable } from 'stream'

import { retry, Options, getLog, Log } from '../utils'

async function uploadS3Object(
  params: {
    Region: string
    BucketName: string
    Key: string
    Body: Writable
    ContentType?: string
  },
  log: Log = getLog('UPLOAD-S3-OBJECT')
): Promise<void> {
  const { Region, BucketName, Key, Body, ContentType } = params

  const s3 = new S3({ region: Region })

  try {
    log.debug(`Upload the S3 object "${Key}" to "${BucketName}"`)

    const upload = retry(
      s3,
      s3.upload,
      Options.Defaults.override({ log, maxAttempts: 1, silent: true })
    )

    await upload({
      Bucket: BucketName,
      Key,
      Body,
      ContentType
    })
  } catch (error) {
    log.debug(`Failed to upload the S3 object "${Key}" to "${BucketName}"`)
    throw error
  }

  log.debug(`The S3 object "${Key}" has been uploaded to "${BucketName}"`)
}

export default uploadS3Object
