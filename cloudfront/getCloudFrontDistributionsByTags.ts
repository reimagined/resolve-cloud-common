import Cloudfront from 'aws-sdk/clients/cloudfront'
import TaggingAPI, {
  GetResourcesInput,
  GetResourcesOutput
} from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log } from '../utils'

async function getResourcesByTags(
  params: {
    Region: string
    Tags: { [key: string]: string }
  },
  log: Log
): Promise<Array<{ ResourceARN: string; Tags: Record<string, string> }>> {
  const { Region, Tags } = params

  const TagFilters = Object.entries(Tags).map(([Key, Value]) => ({ Key, Values: [Value] }))

  const api = new TaggingAPI({ region: Region })

  const getResources = retry<GetResourcesInput, GetResourcesOutput>(
    api,
    api.getResources,
    Options.Defaults.override({ log })
  )

  const resources: Array<{ ResourceARN: string; Tags: Record<string, string> }> = []

  try {
    log.debug(`Find resources by tags`)

    let PaginationToken: string | undefined
    for (;;) {
      log.debug(`Get resources by PaginationToken = ${PaginationToken ?? '<none>'}`)
      const {
        ResourceTagMappingList = [],
        PaginationToken: NextPaginationToken
      } = await getResources({
        ResourceTypeFilters: ['cloudfront'],
        TagFilters,
        PaginationToken
      })
      PaginationToken = NextPaginationToken

      for (const { ResourceARN, Tags: ResourceTags = [] } of ResourceTagMappingList) {
        if (ResourceARN != null) {
          resources.push({
            ResourceARN,
            Tags: ResourceTags.reduce((acc, { Key, Value }) => {
              acc[Key] = Value
              return acc
            }, {})
          })
        }
      }

      if (
        ResourceTagMappingList == null ||
        ResourceTagMappingList.length === 0 ||
        NextPaginationToken == null ||
        NextPaginationToken === ''
      ) {
        break
      }
    }

    log.debug(`Resources have been found`)
  } catch (error) {
    log.debug(`Failed to find resources by tags`)
    throw error
  }

  return resources
}

async function getResourceArns(
  params: {
    Region: string
  },
  log: Log
): Promise<Set<string>> {
  const { Region } = params

  const cloudFront = new Cloudfront({ region: Region })

  const listDistributions = retry(
    cloudFront,
    cloudFront.listDistributions,
    Options.Defaults.override({ log })
  )

  const items: Array<string> = []

  try {
    log.debug(`List distributions`)

    let Marker: string | undefined
    for (;;) {
      log.debug(`Get resources by Marker = ${Marker ?? '<none>'}`)
      const {
        DistributionList: { Items = [], IsTruncated, NextMarker } = {}
      } = await listDistributions({
        Marker
      })

      items.push(...Items.map(({ ARN }) => ARN))

      if (
        !IsTruncated ||
        Items == null ||
        Items.length === 0 ||
        NextMarker == null ||
        NextMarker === ''
      ) {
        break
      }

      Marker = NextMarker
    }

    log.debug(`List resources have been found`)
  } catch (error) {
    log.debug(`Failed to find list resources`)
    throw error
  }

  return new Set(items)
}

async function getCloudFrontDistributionsByTags(
  params: {
    Region: string
    Tags: { [key: string]: string }
  },
  log: Log = getLog('GET-CLOUD-FRONT-DISTRIBUTIONS-BY-TAGS')
): Promise<Array<{ ResourceARN: string; Tags: { [key: string]: string } }>> {
  const [resourcesByTags, listResources] = await Promise.all([
    getResourcesByTags(params, log),
    getResourceArns(params, log)
  ])

  const resources = resourcesByTags.filter(({ ResourceARN }) => listResources.has(ResourceARN))

  log.verbose(resources)

  return resources
}

export default getCloudFrontDistributionsByTags
