import TaggingAPI, { ResourceTagMappingList } from 'aws-sdk/clients/resourcegroupstaggingapi'
import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

async function getFunctionByTags(
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-FUNCTION-BY-TAGS')
): Promise<{
  ResourceARN: string
  Tags: Record<string, string>
} | null> {
  const { Region, Tags } = params

  const TagFilters = Object.entries(Tags).map(([Key, Value]) => ({ Key, Values: [Value] }))

  const api = new TaggingAPI({ region: Region })
  const lambda = new Lambda({ region: Region })

  const getResources = retry(api, api.getResources, Options.Defaults.override({ log }))
  const getFunctionConfiguration = retry(
    lambda,
    lambda.getFunctionConfiguration,
    Options.Defaults.override({ log, expectedErrors: ['ResourceNotFoundException'] })
  )

  let resources: ResourceTagMappingList | undefined

  try {
    log.debug(`Find resources by tags`)
    resources = (
      await getResources({
        ResourceTypeFilters: ['lambda'],
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
    await getFunctionConfiguration({ FunctionName: ResourceARN })
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

export default getFunctionByTags
