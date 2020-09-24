import TaggingAPI, { ResourceTagMappingList } from 'aws-sdk/clients/resourcegroupstaggingapi'
import StepFunctions from 'aws-sdk/clients/stepfunctions'

import { retry, Options, getLog, Log } from '../utils'

const getStepFunctionBuTags = async (
  params: {
    Region: string
    Tags: Array<{ key: string; value: string }>
  },
  log: Log = getLog('DESCRIBE-STEP-FUNCTION-EXECUTION')
): Promise<string | null> => {
  const { Region, Tags } = params

  const api = new TaggingAPI({ region: Region })
  const stepFunctions = new StepFunctions({ region: Region })

  const TagFilters = Object.entries(Tags).map(([key, value]) => ({ Key: key, Values: [value] }))

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

  if (resources == null || resources.length === 0) {
    return null
  }
  if (resources.length > 1) {
    log.verbose(resources.map(({ ResourceARN }) => ResourceARN).filter((arn) => arn != null))
    throw new Error('Too Many Resources')
  }

  const { ResourceARN } = resources[0]
  if (ResourceARN == null) {
    return null
  }

  try {
    await describeStateMachine({ stateMachineArn: ResourceARN })
  } catch (error) {
    if (error != null && error.code === 'StateMachineDoesNotExist') {
      return null
    }
    throw error
  }

  log.verbose(ResourceARN)

  return ResourceARN
}

export default getStepFunctionBuTags
