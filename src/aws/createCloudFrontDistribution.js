const CloudFront = require('aws-sdk/clients/cloudfront')

const { retry, Options } = require('../utils')

const createCloudFrontDistribution = async ({ Region, DistributionConfig, Tags }) => {
  const cloudFront = new CloudFront({ region: Region })

  const createDistributionWithTags = retry(cloudFront, cloudFront.createDistributionWithTags, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  return createDistributionWithTags({
    DistributionConfigWithTags: {
      DistributionConfig,
      Tags
    }
  })
}

module.exports = createCloudFrontDistribution
