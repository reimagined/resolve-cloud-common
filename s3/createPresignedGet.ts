import S3 from 'aws-sdk/clients/s3'

import { getLog, Log } from '../utils'

const createPresignedGet = async (
  params: {
    Region: string
    BucketName: string
    Key: string
    Expires?: number /* in seconds */
    UseAccelerateEndpoint?: boolean
  },
  log: Log = getLog(`CREATE-PRESIGNED-GET`)
): Promise<string> => {
  const { Region, BucketName, Key, Expires, UseAccelerateEndpoint = false } = params

  const s3 = new S3({
    region: Region,
    signatureVersion: 'v4',
    useAccelerateEndpoint: UseAccelerateEndpoint
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

export default createPresignedGet
