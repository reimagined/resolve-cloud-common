const S3 = require('aws-sdk/clients/s3')

const { retry, Options } = require('../utils')

const createS3Bucket = async ({ Region, BucketName, ACL }, { region }) => {
  const s3 = new S3({ region: Region })

  const params = {
    Bucket: BucketName,
    ACL
  }

  if (Region !== region) {
    params.CreateBucketConfiguration = {
      LocationConstraint: Region
    }
  }

  const createBucket = retry(s3, s3.createBucket, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  return createBucket(params)
}

module.exports = createS3Bucket
