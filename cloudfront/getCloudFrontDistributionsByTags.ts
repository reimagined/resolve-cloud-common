import Cloudfront, { DistributionSummary } from 'aws-sdk/clients/cloudfront'
import TaggingAPI from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log } from '../utils'
import { DEFAULT_REGION } from './constants'

async function getResourcesByTags(
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log
): Promise<Record<string, Record<string, string>>> {
  const { Region, Tags } = params

  const TagFilters = Object.entries(Tags).map(([Key, Value]) => ({ Key, Values: [Value] }))

  const api = new TaggingAPI({ region: Region })

  const getResources = retry(api, api.getResources, Options.Defaults.override({ log }))

  const resources: Record<string, Record<string, string>> = {}

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
          resources[ResourceARN] = ResourceTags.reduce(
            (acc: Record<string, string>, { Key, Value }) => {
              acc[Key] = Value
              return acc
            },
            {}
          )
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

async function listResources(
  params: {
    Region: string
  },
  log: Log
): Promise<Array<DistributionSummary>> {
  const { Region } = params

  const cloudFront = new Cloudfront({ region: Region })

  const listDistributions = retry(
    cloudFront,
    cloudFront.listDistributions,
    Options.Defaults.override({ log })
  )

  const items: Array<DistributionSummary> = []

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

      items.push(...Items)

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

  return items
}

async function getCloudFrontDistributionsByTags(
  params: {
    Region?: 'us-east-1'
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-CLOUD-FRONT-DISTRIBUTIONS-BY-TAGS')
): Promise<
  Array<
    {
      Tags: Record<string, string>
      ResourceARN: string
    } & Omit<DistributionSummary, 'ARN'>
  >
> {
  const { Tags, Region = DEFAULT_REGION } = params

  const [resourcesByTags, distributions] = await Promise.all([
    getResourcesByTags(
      {
        Tags,
        Region
      },
      log
    ),
    listResources({ Region }, log)
  ])

  const resources = distributions
    .filter(({ ARN }) => resourcesByTags[ARN] != null)
    .map(({ ARN: ResourceARN, ...other }) => ({
      ...other,
      ResourceARN,
      Tags: resourcesByTags[ResourceARN]
    }))

  log.verbose(resources)

  return resources
}

export default getCloudFrontDistributionsByTags
