const CloudFront = require('aws-sdk/clients/cloudfront')

const { retry, Options } = require('../utils')

const getCloudFrontDistributionById = async ({ Region, Id }) => {
  const cloudFront = new CloudFront({ region: Region })

  const getDistribution = retry(cloudFront, cloudFront.getDistribution, Options.Defaults.override({
    maxAttempts: 5, delay: 1000
  }))

  return getDistribution({
    Id
  })
}

module.exports = getCloudFrontDistributionById
