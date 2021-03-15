import TaggingAPI, {
  ResourceTagMappingList,
  PaginationToken
} from 'aws-sdk/clients/resourcegroupstaggingapi'
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
  let paginationToken: PaginationToken | undefined
  let nextPaginationToken: PaginationToken | undefined
  const foundResourcesList:Array<ResourceTagMappingList> = []

  try {
    log.debug(`Find resources by tags`)
    do {
      void ({
        ResourceTagMappingList: foundResources=[],
        PaginationToken: nextPaginationToken
      } = await getResources({
        PaginationToken: paginationToken,
        ResourceTypeFilters: ['lambda'],
        TagFilters
      }))
      paginationToken = nextPaginationToken
      foundResourcesList.push(foundResources)      
    } while (nextPaginationToken)
   
    log.debug(`Resources have been found`)
  } catch (error) {
    log.debug(`Failed to find resources by tags`)
    throw error
  }

  if (foundResourcesList == null) {
    return []
  }

  const resources = []
  for (const foundResources of foundResourcesList) {
    for (const { ResourceARN, Tags: ResourceTags } of foundResources as ResourceTagMappingList) {
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
  }

  return resources
}

export default getFunctionsByTags
