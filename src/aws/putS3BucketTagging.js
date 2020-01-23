const S3 = require('aws-sdk/clients/s3')

const { retry, Options } = require('../utils')

const putS3BucketTagging = async ({ Region, BucketName, TagSet }) => {
  const s3 = new S3({ region: Region })

  const putBucketTagging = retry(s3, s3.putBucketTagging, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  return putBucketTagging({
    Bucket: BucketName,
    Tagging: {
      TagSet
    }
  })
}

module.exports = putS3BucketTagging
