import TaggingAPI, {
  GetResourcesInput,
  GetResourcesOutput,
  ResourceTagMappingList
} from 'aws-sdk/clients/resourcegroupstaggingapi'
import getUserPool from './getUserPool'

import { retry, Options, getLog, Log } from '../utils'

const getUserPoolByTags = async (
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-USER-POOL-BY-TAGS')
): Promise<{
  ResourceARN: string
  Tags: Record<string, string>
} | null> => {
  const { Region, Tags } = params

  const TagFilters = Object.entries(Tags).map(([Key, Value]) => ({ Key, Values: [Value] }))

  const api = new TaggingAPI({ region: Region })

  const getResources = retry<GetResourcesInput, GetResourcesOutput>(
    api,
    api.getResources,
    Options.Defaults.override({ log })
  )
  let resources: ResourceTagMappingList | undefined

  try {
    log.debug(`Find resources by tags`)
    resources = (
      await getResources({
        ResourceTypeFilters: ['cognito-idp'],
        TagFilters
      })
    ).ResourceTagMappingList

    log.debug(`Resources have been found`)
  } catch (error) {
    log.debug(`Failed to find resources by tags`)
    throw error
  }

  if (resources == null || resources.length === 0) {
    return null
  }
  if (resources.length > 1) {
    log.verbose(resources.map(({ ResourceARN }) => ResourceARN).filter((arn) => arn != null))
    throw new Error('Too Many Resources')
  }

  const { ResourceARN, Tags: ResourceTagList = [] } = resources[0]
  if (ResourceARN == null) {
    return null
  }

  try {
    await getUserPool({
      Region,
      UserPoolArn: ResourceARN
    })
  } catch (error) {
    if (error != null && error.code === 'ResourceNotFoundException') {
      return null
    }
    throw error
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

export default getUserPoolByTags
