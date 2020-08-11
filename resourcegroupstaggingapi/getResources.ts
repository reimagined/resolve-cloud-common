import ResourceGroupsTaggingAPI, {
  GetResourcesOutput,
} from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      TagFilters: Array<{ Key: string; Values: Array<string> }>
      ResourceTypeFilters: Array<string>
    },
    log?: Log
  ): Promise<GetResourcesOutput>
}

const getResources: TMethod = async (
  { Region, TagFilters, ResourceTypeFilters },
  log = getLog('GET-RESOURCES')
) => {
  const resourceGroupsTaggingAPI = new ResourceGroupsTaggingAPI({ region: Region })

  try {
    log.debug(`Get resource certificate`)

    const getResourcesExecutor = retry(
      resourceGroupsTaggingAPI,
      resourceGroupsTaggingAPI.getResources,
      Options.Defaults.override({ log })
    )

    const getResult = await getResourcesExecutor({ TagFilters, ResourceTypeFilters })

    if (getResult == null) {
      throw new Error('Resource certificate not found')
    }

    log.debug(`Resource certificate have been got`)

    return getResult
  } catch (error) {
    log.debug(`Failed to get resource certificate`)

    throw error
  }
}

export default getResources
