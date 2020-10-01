import TaggingAPI, { ResourceTagMappingList } from 'aws-sdk/clients/resourcegroupstaggingapi'
import StepFunctions from 'aws-sdk/clients/stepfunctions'

import { retry, Options, getLog, Log } from '../utils'

const getStepFunctionByTags = async (
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-STEP-FUNCTION-BY-TAGS')
): Promise<{
  ResourceARN: string
  Tags: Record<string, string>
} | null> => {
  const { Region, Tags } = params

  const api = new TaggingAPI({ region: Region })
  const stepFunctions = new StepFunctions({ region: Region })

  const TagFilters = Object.entries(Tags).map(([Key, Value]) => ({ Key, Values: [Value] }))

  const getResources = retry(api, api.getResources, Options.Defaults.override({ log }))
  const describeStateMachine = retry(
    stepFunctions,
    stepFunctions.describeStateMachine,
    Options.Defaults.override({ log })
  )

  let resources: ResourceTagMappingList | undefined

  try {
    log.debug(`Find resources by tags`)
    resources = (
      await getResources({
        ResourceTypeFilters: ['states'],
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
        (await describeStateMachine({ stateMachineArn: resource.ResourceARN })) != null
      ) {
        resources.push(resource)
      }
    } catch (error) {
      if (error != null && error.code === 'StateMachineDoesNotExist') {
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
    throw new Error('Too Many Resources')
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

export default getStepFunctionByTags
