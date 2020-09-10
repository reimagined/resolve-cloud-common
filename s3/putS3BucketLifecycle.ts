import S3, { LifecycleConfiguration } from 'aws-sdk/clients/s3'

import { retry, getLog } from '../utils'

const putS3BucketLifecycle = async (
  params: {
    Region: string
    BucketName: string
    LifecycleConfiguration: LifecycleConfiguration
  },
  log = getLog('PUT-S3-BUCKET-LIFECYCLE')
): Promise<void> => {
  const { Region, BucketName, LifecycleConfiguration: Config } = params

  const s3 = new S3({ region: Region })

  log.debug(`Adjusting bucket ${BucketName} expiration lifecycle policy`)

  const putBucketLifecycle = retry(s3, s3.putBucketLifecycle)

  await putBucketLifecycle({
    Bucket: BucketName,
    LifecycleConfiguration: Config
  })

  log.debug(`Bucket ${BucketName} expiration lifecycle policy adjusted`)
}

export default putS3BucketLifecycle
