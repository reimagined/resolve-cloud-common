import TaggingAPI, { ResourceTagMappingList } from 'aws-sdk/clients/resourcegroupstaggingapi'
import StepFunctions from 'aws-sdk/clients/stepfunctions'

import { retry, Options, getLog, Log } from '../utils'

const getStepFunctionsByTags = async (
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-STEP-FUNCTIONS-BY-TAGS')
): Promise<
  Array<{
    ResourceARN: string
    Tags: Record<string, string>
  }>
> => {
  const { Region, Tags } = params

  const TagFilters = Object.entries(Tags).map(([Key, Value]) => ({ Key, Values: [Value] }))

  const api = new TaggingAPI({ region: Region })
  const stepFunctions = new StepFunctions({ region: Region })

  const getResources = retry(api, api.getResources, Options.Defaults.override({ log }))
  const describeStateMachine = retry(
    stepFunctions,
    stepFunctions.describeStateMachine,
    Options.Defaults.override({ log, expectedErrors: ['StateMachineDoesNotExist'] })
  )

  let foundResources: ResourceTagMappingList | undefined

  try {
    log.debug(`Find resources by tags`)
    foundResources = (
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

  if (foundResources == null) {
    return []
  }

  const resources = []
  for (const { ResourceARN, Tags: ResourceTags } of foundResources) {
    try {
      if (
        ResourceARN != null &&
        (await describeStateMachine({ stateMachineArn: ResourceARN })) != null
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
      if (error != null && error.code === 'StateMachineDoesNotExist') {
        continue
      }
      throw error
    }
  }

  return resources
}

export default getStepFunctionsByTags
