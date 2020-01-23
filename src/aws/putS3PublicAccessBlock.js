const S3 = require('aws-sdk/clients/s3')

const { retry, Options } = require('../utils')

const putS3PublicAccessBlock = async ({ Region, BucketName, PublicAccessBlockConfiguration }) => {
  const s3 = new S3({ region: Region })

  const putPublicAccessBlock = retry(s3, s3.putPublicAccessBlock, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  return putPublicAccessBlock({
    Bucket: BucketName,
    PublicAccessBlockConfiguration
  })
}

module.exports = putS3PublicAccessBlock
