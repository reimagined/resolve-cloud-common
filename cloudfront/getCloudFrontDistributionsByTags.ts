import TaggingAPI, { ResourceTagMapping } from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log } from '../utils'

async function getCloudFrontDistributionsByTags(
  params: {
    Region: string
    Tags: { [key: string]: string }
  },
  log: Log = getLog('GET-CLOUD-FRONT-DISTRIBUTIONS-BY-TAGS')
): Promise<Array<{ ResourceARN: string; Tags: { [key: string]: string } }>> {
  const { Region, Tags } = params

  const TagFilters = Object.entries(Tags).map(([Key, Value]) => ({ Key, Values: [Value] }))

  const api = new TaggingAPI({ region: Region })

  const getResources = retry(api, api.getResources, Options.Defaults.override({ log }))

  const resources: ResourceTagMapping[] = []

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

      resources.push(...ResourceTagMappingList)

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

  const foundResources: Array<{ ResourceARN: string; Tags: { [key: string]: string } }> = []

  for (const { ResourceARN, Tags: ResultTags = [] } of resources) {
    if (ResourceARN != null && Array.isArray(ResultTags)) {
      foundResources.push({
        ResourceARN,
        Tags: ResultTags.reduce((acc, { Key, Value }) => {
          acc[Key] = Value
          return acc
        }, {})
      })
    }
  }

  log.verbose(foundResources)

  return foundResources
}

export default getCloudFrontDistributionsByTags
