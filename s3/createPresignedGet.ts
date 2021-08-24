import S3 from 'aws-sdk/clients/s3'

import { getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      BucketName: string
      Key: string
      Expires?: number /* in seconds */
    },
    log?: Log
  ): Promise<string>
}

const createPresignedPut: TMethod = async (
  { Region, BucketName, Key, Expires },
  log = getLog(`CREATE-PRESIGNED-GET`)
) => {
  const s3 = new S3({
    region: Region,
    signatureVersion: 'v4'
  })

  try {
    log.debug(`Create signed url for GET-request from "${BucketName}" S3 bucket`)

    return s3.getSignedUrl('getObject', {
      Bucket: BucketName,
      Key,
      Expires
    })
  } catch (error) {
    log.error('Signed url creating is failed')
    throw error
  }
}

export default createPresignedPut
