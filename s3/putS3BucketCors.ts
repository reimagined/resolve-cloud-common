import S3 from 'aws-sdk/clients/s3'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      BucketName: string
    },
    log?: Log
  ): Promise<void>
}

const putS3BucketCors: TMethod = async (
  { Region, BucketName },
  log = getLog('PUT-S3-BUCKET-CORS')
) => {
  const s3 = new S3({ region: Region })

  try {
    log.debug(`Put "${BucketName}" bucket CORS`)

    const putBucketCors = retry(
      s3,
      s3.putBucketCors,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000
      })
    )

    await putBucketCors({
      Bucket: BucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            MaxAgeSeconds: 3000,
            AllowedHeaders: ['Authorization']
          }
        ]
      }
    })

    log.debug('Bucket CORS put successfully')
  } catch (error) {
    log.error('Bucket CORS put failed')
    throw error
  }
}

export default putS3BucketCors
