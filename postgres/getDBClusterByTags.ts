import TaggingAPI, { ResourceTagMappingList } from 'aws-sdk/clients/resourcegroupstaggingapi'
import RDS from 'aws-sdk/clients/rds'

import { retry, Options, getLog, Log } from '../utils'

async function getDBClusterByTags(
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-DB-CLUSTER-BY-TAGS')
): Promise<{
  ResourceARN: string
  Tags: Record<string, string>
} | null> {
  const { Region, Tags } = params

  const TagFilters = Object.entries(Tags).map(([Key, Value]) => ({ Key, Values: [Value] }))

  const api = new TaggingAPI({ region: Region })
  const rds = new RDS({ region: Region })

  const getResources = retry(api, api.getResources, Options.Defaults.override({ log }))
  const describeDBClusters = retry(
    rds,
    rds.describeDBClusters,
    Options.Defaults.override({ log, expectedErrors: ['DBClusterNotFoundFault'] })
  )

  let resources: ResourceTagMappingList | undefined

  try {
    log.debug(`Find resources by tags`)
    resources = (
      await getResources({
        ResourceTypeFilters: ['rds'],
        TagFilters
      })
    ).ResourceTagMappingList

    log.debug(`Resources have been found`)
  } catch (error) {
    log.debug(`Failed to find resources by tags`)
    throw error
  }

  if (resources == null) {
    return null
  }

  const allResources = resources
  resources = []
  for (const resource of allResources) {
    try {
      if (
        resource.ResourceARN != null &&
        (await describeDBClusters({
          DBClusterIdentifier: resource.ResourceARN.split(':').splice(-1)[0]
        })) != null
      ) {
        resources.push(resource)
      }
    } catch (error) {
      if (error != null && error.code === 'DBClusterNotFoundFault') {
        continue
      }
      throw error
    }
  }

  if (resources.length === 0) {
    return null
  }

  if (resources.length > 1) {
    log.verbose(resources.map(({ ResourceARN }) => ResourceARN).filter((arn) => arn != null))
    throw new Error(
      `Too Many Resources: ${JSON.stringify(resources.map(({ ResourceARN }) => ResourceARN))}`
    )
  }

  const { ResourceARN, Tags: ResourceTagList = [] } = resources[0]
  if (ResourceARN == null) {
    return null
  }

  log.verbose(ResourceARN)
  log.verbose(ResourceTagList)

  return {
    ResourceARN,
    Tags: ResourceTagList.reduce((acc: Record<string, string>, { Key, Value }) => {
      acc[Key] = Value
      return acc
    }, {})
  }
}

export default getDBClusterByTags
