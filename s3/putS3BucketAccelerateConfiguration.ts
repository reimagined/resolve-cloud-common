import S3, { AccelerateConfiguration } from 'aws-sdk/clients/s3'

import { retry, getLog, Options } from '../utils'

const putS3BucketAccelerateConfiguration = async (
  params: {
    Region: string
    BucketName: string
    AccelerateConfiguration: AccelerateConfiguration
  },
  log = getLog('PUT-S3-BUCKET-ACCELERATE-CONFIGURATION')
): Promise<void> => {
  const { Region, BucketName, AccelerateConfiguration: Config } = params

  const s3 = new S3({ region: Region })

  const putBucketLifecycle = retry(
    s3,
    s3.putBucketAccelerateConfiguration,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000
    })
  )

  try {
    log.debug(`Put "${BucketName}" bucket accelerate configuration`)

    await putBucketLifecycle({
      Bucket: BucketName,
      AccelerateConfiguration: Config
    })

    log.debug(`Bucket accelerate configuration put successfully`)
  } catch (error) {
    log.error(`Bucket accelerate configuration put failed`)
    throw error
  }
}

export default putS3BucketAccelerateConfiguration
