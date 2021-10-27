import TaggingAPI, { ResourceTagMappingList } from 'aws-sdk/clients/resourcegroupstaggingapi'
import RDS from 'aws-sdk/clients/rds'

import { retry, Options, getLog, Log } from '../utils'

async function getDBClusterByTags(
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-DB-CLUSTERS-BY-TAGS')
): Promise<
  Array<{
    ResourceARN: string
    Tags: Record<string, string>
  }>
> {
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
    return []
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

  log.verbose(resources)

  return resources.reduce<
    Array<{
      ResourceARN: string
      Tags: Record<string, string>
    }>
  >((result, { ResourceARN, Tags: ResourceTagList }) => {
    if (ResourceARN != null && ResourceTagList != null) {
      const Tags = ResourceTagList.reduce((acc: Record<string, string>, { Key, Value }) => {
        acc[Key] = Value
        return acc
      }, {})

      result.push({ ResourceARN, Tags })
    }
    return result
  }, [])
}

export default getDBClusterByTags
