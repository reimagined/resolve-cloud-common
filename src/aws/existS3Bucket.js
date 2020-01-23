const S3 = require('aws-sdk/clients/s3')

const { retry, Options } = require('../utils')

const existS3Bucket = async ({ Region, BucketName }) => {
  const s3 = new S3({ region: Region })

  const headBucket = retry(s3, s3.headBucket, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  try {
    await headBucket({
      Bucket: BucketName
    })

    return true
  } catch (error) {
    if (error.code === 'NotFound') {
      return false
    }
    throw error
  }
}

module.exports = existS3Bucket
