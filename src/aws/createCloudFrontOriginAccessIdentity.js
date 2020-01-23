const CloudFront = require('aws-sdk/clients/cloudfront')

const { retry, Options } = require('../utils')

const createCloudFrontOriginAccessIdentity = async ({ Region, Comment }) => {
  const cloudFront = new CloudFront({ region: Region })

  const createCloudFrontOriginAccessIdentity = retry(
    cloudFront,
    cloudFront.createCloudFrontOriginAccessIdentity,
    Options.Defaults.override({ maxAttempts: 5, delay: 1000 })
  )

  return createCloudFrontOriginAccessIdentity({
    CloudFrontOriginAccessIdentityConfig: {
      CallerReference: Comment,
      Comment
    }
  })
}

module.exports = createCloudFrontOriginAccessIdentity
