import S3 from 'aws-sdk/clients/s3'
import { Writable } from 'stream'

import { retry, Options, getLog, Log } from '../utils'

// TODO @deprecated
interface TMethod {
  (
    params: {
      Region: string
      Bucket: string
      Key: string
      Body: Writable
      ContentType?: string
    },
    log?: Log
  ): Promise<void>
}

interface TMethod {
  (
    params: {
      Region: string
      BucketName: string
      Key: string
      Body: Writable
      ContentType?: string
    },
    log?: Log
  ): Promise<void>
}

const uploadS3Object: TMethod = async (
  { Region, Bucket, BucketName: OriginalBucketName, Key, Body, ContentType },
  log = getLog('UPLOAD-S3-OBJECT')
) => {
  if (Bucket != null) {
    log.warn('The parameter "Bucket" is deprecated')
  }
  if (OriginalBucketName == null) {
    log.warn('The parameter "BucketName" is required')
  }

  const BucketName = OriginalBucketName || Bucket

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
