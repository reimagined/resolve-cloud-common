import S3 from 'aws-sdk/clients/s3'

import { getLog, Log } from '../utils'

const createPresignedPut = async (
  params: {
    Region: string
    BucketName: string
    Key: string
    Expires?: number /* in seconds */
    ContentLength?: number
    ContentType?: string
    Metadata?: Record<string, string>
    UseAccelerateEndpoint?: boolean
  },
  log: Log = getLog(`CREATE-PRESIGNED-PUT`)
): Promise<string> => {
  const {
    Region,
    BucketName,
    Key,
    Expires,
    Metadata,
    ContentType,
    ContentLength,
    UseAccelerateEndpoint = false
  } = params
  const s3 = new S3({
    region: Region,
    signatureVersion: 'v4',
    useAccelerateEndpoint: UseAccelerateEndpoint
  })

  try {
    log.debug(`Create signed url for PUT-request to "${BucketName}" S3 bucket`)

    return s3.getSignedUrl('putObject', {
      Bucket: BucketName,
      Key,
      Expires,
      Metadata,
      ContentType,
      ContentLength
    })
  } catch (error) {
    log.error('Signed url creating is failed')
    throw error
  }
}

export default createPresignedPut
