const CloudFront = require('aws-sdk/clients/cloudfront')

const { retry, Options } = require('../utils')

const listCloudFrontOriginAccessIdentities = async ({ Region, Marker, MaxItems = '200' }) => {
  const cloudFront = new CloudFront({ region: Region })

  const listCloudFrontOriginAccessIdentities = retry(
    cloudFront,
    cloudFront.listCloudFrontOriginAccessIdentities,
    Options.Defaults.override({
      maxAttempts: 5, delay: 1000
    })
  )

  return listCloudFrontOriginAccessIdentities({
    Marker,
    MaxItems
  })
}

module.exports = listCloudFrontOriginAccessIdentities
