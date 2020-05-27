import S3 from 'aws-sdk/clients/s3'
import { Readable } from 'stream'

import { getLog, Log } from '../utils'

function getS3ObjectAsStream(
  params: {
    Region: string
    BucketName: string
    FileKey: string
    Skip?: number
    Limit?: number
  },
  log: Log = getLog('GET-S3-OBJECT-AS-STREAM')
): Readable {
  const { Region, BucketName, FileKey, Skip = null, Limit = null } = params

  let Range: string | undefined
  if ((Skip == null) !== (Limit == null)) {
    throw new Error(`Incorrect params ${JSON.stringify({ Skip, Limit })}`)
  }
  if (Skip != null && Limit != null) {
    Range = `bytes=${Skip}-${Skip + Limit}`
  }

  log.debug(`Get the S3 object "${FileKey}" from "${BucketName}"`)

  const s3 = new S3({ region: Region })

  try {
    return s3
      .getObject({
        Bucket: BucketName,
        Key: FileKey,
        Range
      })
      .createReadStream()
  } catch (error) {
    log.debug(`Failed to get the S3 object "${FileKey}" from "${BucketName}"`)
    throw error
  }
}

export default getS3ObjectAsStream
