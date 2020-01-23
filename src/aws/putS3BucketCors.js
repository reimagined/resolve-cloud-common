const S3 = require('aws-sdk/clients/s3')

const { retry, Options } = require('../utils')

const putS3BucketCors = async ({ Region, BucketName }) => {
  const s3 = new S3({ region: Region })

  const putBucketCors = retry(s3, s3.putBucketCors, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  return putBucketCors({
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
}

module.exports = putS3BucketCors
