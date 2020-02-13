import S3 from 'aws-sdk/clients/s3'

import { retry, Options, getLog, Log } from '../../utils'

interface TMethod {
  (
    params: {
      Region: string
      BucketName: string,
      ACL: string
    },
    log?: Log
  ): Promise<void>
}

const createS3Bucket: TMethod = async ({ Region, BucketName, ACL }, log = getLog(`CREATE-S3-BUCKET`)) => {
  const s3 = new S3({ region: Region })

  try {
    log.debug(`Create "${BucketName}" S3 bucket`)

    const params = {
      Bucket: BucketName,
      ACL,
      CreateBucketConfiguration: {
        LocationConstraint: Region
      }
    }

    const createBucket = retry(s3, s3.createBucket, Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000
    }))

    await createBucket(params)
  } catch (error) {
    log.error('Bucket creating is failed')
    throw error
  }
}

export default createS3Bucket
