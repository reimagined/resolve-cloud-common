import S3 from 'aws-sdk/clients/s3'
import { Readable } from 'stream'

import { getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Bucket: string
      Key: string
    },
    log?: Log
  ): Readable
}

const getS3ObjectAsStream: TMethod = (
  { Region, Bucket, Key },
  log = getLog('GET-S3-OBJECT-AS-STREAM')
) => {
  const s3 = new S3({ region: Region })

  try {
    log.debug(`Get the S3 object "${Key}" from "${Bucket}"`)

    return s3
      .getObject({
        Bucket,
        Key,
        RequestPayer: 'requester'
      })
      .createReadStream()
  } catch (error) {
    log.debug(`Failed to get the S3 object "${Key}" from "${Bucket}"`)
    throw error
  }
}

export default getS3ObjectAsStream
