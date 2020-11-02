import TaggingAPI, { ResourceTagMappingList } from 'aws-sdk/clients/resourcegroupstaggingapi'
import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

async function getFunctionsByTags(
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-FUNCTIONS-BY-TAGS')
): Promise<
  Array<{
    ResourceARN: string
    Tags: Record<string, string>
  }>
> {
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

  let foundResources: ResourceTagMappingList | undefined

  try {
    log.debug(`Find resources by tags`)
    foundResources = (
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

  if (foundResources == null) {
    return []
  }

  const resources = []
  for (const { ResourceARN, Tags: ResourceTags } of foundResources) {
    try {
      if (
        ResourceARN != null &&
        (await getFunctionConfiguration({ FunctionName: ResourceARN })) != null
      ) {
        resources.push({
          ResourceARN,
          Tags:
            ResourceTags != null
              ? ResourceTags.reduce((acc: Record<string, string>, { Key, Value }) => {
                  acc[Key] = Value
                  return acc
                }, {})
              : {}
        })
      }
    } catch (error) {
      if (error != null && error.code === 'ResourceNotFoundException') {
        continue
      }
      throw error
    }
  }

  return resources
}

export default getFunctionsByTags
