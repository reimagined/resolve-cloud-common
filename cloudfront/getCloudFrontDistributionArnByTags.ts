// TODO: unit tests
import isEqual from 'lodash.isequal'
import differenceWith from 'lodash.differencewith'
import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'

const findDistribution = async (
  cf: CloudFront,
  tagFilter,
  log: Log,
  marker?: string
): Promise<string | null> => {
  const listDistributions = retry(
    cf,
    cf.listDistributions,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000,
    })
  )

  const { DistributionList } = await listDistributions(marker ? { Marker: marker } : {})

  if (DistributionList == null) {
    throw new Error('unknown resource distribution list')
  }

  const { NextMarker, Items, IsTruncated } = DistributionList

  if (Items == null) {
    throw new Error('unknown resource items in distribution list')
  }

  const taggedResources: Array<{ arn: string; tags: Array<{ Key: string; Value?: string }> }> = []

  const listTagsForResource = retry(
    cf,
    cf.listTagsForResource,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000,
    })
  )

  for (const { ARN: arn } of Items) {
    const {
      Tags: { Items: tags },
    } = await listTagsForResource({
      Resource: arn,
    })

    if (tags != null) {
      taggedResources.push({
        arn,
        tags,
      })
    }
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

interface TMethod {
  (
    params: {
      Region: string
      Tags: Array<{ Key: string; Value: string }>
    },
    log?: Log
  ): Promise<string | null>
}

const getCloudFrontDistributionArnByTags: TMethod = async (
  { Region, Tags },
  log = getLog('GET-CLOUD-FRONT-DISTRIBUTION')
) => {
  const cf = new CloudFront({ region: Region })
  return findDistribution(cf, Tags, log)
}

export default getCloudFrontDistributionArnByTags
