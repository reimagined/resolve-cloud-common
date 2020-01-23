const S3 = require('aws-sdk/clients/s3')

const { retry, Options } = require('../utils')

const putS3BucketPolicy = async ({ Region, BucketName, Policy }) => {
  const s3 = new S3({ region: Region })

  const putBucketPolicy = retry(s3, s3.putBucketPolicy, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  return putBucketPolicy({
    Bucket: BucketName,
    Policy: JSON.stringify(Policy)
  })
}

module.exports = putS3BucketPolicy
