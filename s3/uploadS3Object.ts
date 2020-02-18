import S3 from 'aws-sdk/clients/s3'
import { Writable } from 'stream'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Bucket: string
      Key: string
      Body: Writable
      ContentType: string
    },
    log?: Log
  ): Promise<void>
}

const uploadS3Object: TMethod = async (
  { Region, Bucket, Key, Body, ContentType },
  log = getLog('UPLOAD-S3-OBJECT')
) => {
  const s3 = new S3({ region: Region })

  try {
    log.debug(`Upload the S3 object "${Key}" to "${Bucket}"`)

    const upload = retry(
      s3,
      s3.upload,
      Options.Defaults.override({ log, maxAttempts: 1, silent: true })
    )
    await upload({
      Bucket,
      Key,
      Body,
      ContentType
    })
  } catch (error) {
    log.debug(`Failed to upload the S3 object "${Key}" to "${Bucket}"`)
    throw error
  }

  log.debug(`The S3 object "${Key}" has been uploaded to "${Bucket}"`)
}

export default uploadS3Object
