import TaggingAPI, { ResourceTagMappingList } from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log } from '../utils'

async function getS3BucketByTags(
  params: {
    Region: string
    Tags: { [key: string]: string }
  },
  log: Log = getLog('GET-S3-BUCKET-BY-TAGS')
): Promise<string> {
  const { Region, Tags } = params

  const TagFilters = Object.entries(Tags).map(([Key, Value]) => ({ Key, Values: [Value] }))

  const api = new TaggingAPI({ region: Region })

  const getResources = retry(api, api.getResources, Options.Defaults.override({ log }))

  let resources: ResourceTagMappingList | undefined

  try {
    log.debug(`Find resources by tags`)
    resources = (
      await getResources({
        ResourceTypeFilters: ['s3'],
        TagFilters
      })
    ).ResourceTagMappingList

    log.debug(`Resources have been found`)
  } catch (error) {
    log.debug(`Failed to find resources by tags`)
    throw error
  }

  if (resources == null || resources.length === 0) {
    throw new Error('Resource Not Found')
  }
  if (resources.length > 1) {
    log.verbose(resources.map(({ ResourceARN }) => ResourceARN).filter((arn) => arn != null))
    throw new Error('Too Many Resources')
  }

  const { ResourceARN } = resources[0]
  if (ResourceARN == null) {
    throw new Error('Resource Not Found')
  }

  log.verbose(ResourceARN)

  return ResourceARN
}

export default getS3BucketByTags
