const CloudFront = require('aws-sdk/clients/cloudfront')

const { retry, Options } = require('../utils')

const updateCloudFrontDistribution = async ({ Region, DistributionConfig, Id, IfMatch }) => {
  const cloudFront = new CloudFront({ region: Region })

  const updateDistribution = retry(cloudFront, cloudFront.updateDistribution, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  return updateDistribution({
    DistributionConfig,
    Id,
    IfMatch
  })
}

module.exports = updateCloudFrontDistribution
