import S3, { Body as S3ObjectBody } from 'aws-sdk/clients/s3'

import { retry, Options, getLog, Log } from '../utils'

async function uploadS3Object(
  params: {
    Region: string
    BucketName: string
    FileKey: string
    Body: S3ObjectBody
    ContentType?: string
    Metadata?: Record<string, string>
  },
  log: Log = getLog('UPLOAD-S3-OBJECT')
): Promise<void> {
  const { Region, BucketName, FileKey, Body, ContentType, Metadata } = params

  const s3 = new S3({ region: Region })

  try {
    log.debug(`Upload the S3 object "${FileKey}" to "${BucketName}"`)

    const upload = retry(
      s3,
      s3.upload,
      Options.Defaults.override({ log, maxAttempts: 1, silent: true })
    )

    await upload({
      Bucket: BucketName,
      Key: FileKey,
      Body,
      ContentType,
      Metadata
    })
  } catch (error) {
    log.debug(`Failed to upload the S3 object "${FileKey}" to "${BucketName}"`)
    throw error
  }

  log.debug(`The S3 object "${FileKey}" has been uploaded to "${BucketName}"`)
}

export default uploadS3Object
