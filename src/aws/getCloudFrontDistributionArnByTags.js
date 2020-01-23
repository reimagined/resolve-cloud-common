// TODO: unit tests
const { differenceWith, isEqual } = require('lodash')
const CloudFront = require('aws-sdk/clients/cloudfront')

const { retry, Options } = require('../utils')

const findDistribution = async (cf, tagFilter, log, marker = null) => {
  const listDistributions = retry(cf, cf.listDistributions, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  const {
    DistributionList: { NextMarker, Items, IsTruncated }
  } = await listDistributions(marker ? { Marker: marker } : {})

  const taggedResources = []

  const listTagsForResource = retry(cf, cf.listTagsForResource, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  for (const { ARN: arn } of Items) {
    const {
      Tags: { Items: tags }
    } = await listTagsForResource({
      Resource: arn
    })

    taggedResources.push({
      arn,
      tags
    })
  }

  const resource = taggedResources.find(
    ({ tags }) => differenceWith(tagFilter, tags, isEqual).length === 0
  )

  if (resource) {
    return resource.arn
  }
  if (IsTruncated) {
    return findDistribution(cf, tagFilter, log, NextMarker)
  }
  return null
}

const getCloudFrontDistributionArnByTags = async (
  region,
  tags,
  log
) => {
  const cf = new CloudFront({ region })
  return findDistribution(cf, tags, log)
}

module.exports = getCloudFrontDistributionArnByTags
