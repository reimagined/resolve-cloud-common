import getStepFunctionsByTags from './getStepFunctionsByTags'

import { getLog, Log } from '../utils'

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

  const resources = await getStepFunctionsByTags({
    Region,
    Tags
  })

  if (resources.length === 0) {
    return null
  }

  if (resources.length > 1) {
    log.verbose(resources.map(({ ResourceARN }) => ResourceARN).filter((arn) => arn != null))
    throw new Error('Too Many Resources')
  }

  const { ResourceARN, Tags: ResourceTagList } = resources[0]

  log.verbose(ResourceARN)
  log.verbose(ResourceTagList)

  return {
    ResourceARN,
    Tags: ResourceTagList
  }
}

export default getStepFunctionByTags
