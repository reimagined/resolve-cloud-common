import S3 from 'aws-sdk/clients/s3'

import { getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      BucketName: string
      Key: string
      Expires?: number /* in seconds */
      MaxSize?: number
      ContentType?: string
      Metadata?: { [key: string]: string }
    },
    log?: Log
  ): Promise<string>
}

const createPresignedPut: TMethod = async (
  { Region, BucketName, Key, Expires, Metadata, ContentType },
  log = getLog(`CREATE-PRESIGNED-PUT`)
) => {
  const s3 = new S3({
    region: Region,
    signatureVersion: 'v4'
  })

  try {
    log.debug(`Create signed url for PUT-request to "${BucketName}" S3 bucket`)

    return s3.getSignedUrl('putObject', {
      Bucket: BucketName,
      Key,
      Expires,
      Metadata,
      ContentType
    })
  } catch (error) {
    log.error('Signed url creating is failed')
    throw error
  }
}

export default createPresignedPut
