import getDBClustersByTags from './getDBClustersByTags'
import { getLog, Log } from '../utils'

async function getDBClusterByTags(
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-DB-CLUSTER-BY-TAGS')
): Promise<{
  ResourceARN: string
  Tags: Record<string, string>
} | null> {
  const resources = await getDBClustersByTags(params)

  if (resources.length === 0) {
    return null
  }

  if (resources.length > 1) {
    log.verbose(resources.map(({ ResourceARN }) => ResourceARN).filter((arn) => arn != null))
    throw new Error(
      `Too Many Resources: ${JSON.stringify(resources.map(({ ResourceARN }) => ResourceARN))}`
    )
  }

  if (resources[0].ResourceARN == null) {
    return null
  }

  return resources[0]
}

export default getDBClusterByTags
