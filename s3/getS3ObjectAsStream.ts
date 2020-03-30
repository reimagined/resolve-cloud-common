import S3 from 'aws-sdk/clients/s3'
import { Readable } from 'stream'

import { getLog, Log } from '../utils'

// TODO @deprecated
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

interface TMethod {
  (
    params: {
      Region: string
      BucketName: string
      Key: string
    },
    log?: Log
  ): Readable
}

const getS3ObjectAsStream: TMethod = (
  { Region, Bucket, BucketName: OriginalBucketName, Key },
  log = getLog('GET-S3-OBJECT-AS-STREAM')
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
    log.debug(`Get the S3 object "${Key}" from "${BucketName}"`)

    return s3
      .getObject({
        Bucket: BucketName,
        Key,
        RequestPayer: 'requester'
      })
      .createReadStream()
  } catch (error) {
    log.debug(`Failed to get the S3 object "${Key}" from "${BucketName}"`)
    throw error
  }
}

export default getS3ObjectAsStream
