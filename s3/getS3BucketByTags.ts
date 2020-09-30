import TaggingAPI, { ResourceTagMappingList } from 'aws-sdk/clients/resourcegroupstaggingapi'
import S3 from 'aws-sdk/clients/s3'

import { retry, Options, getLog, Log } from '../utils'

async function getS3BucketByTags(
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-S3-BUCKET-BY-TAGS')
): Promise<{
  ResourceARN: string
  Tags: Record<string, string>
} | null> {
  const { Region, Tags } = params

  const TagFilters = Object.entries(Tags).map(([Key, Value]) => ({ Key, Values: [Value] }))

  const api = new TaggingAPI({ region: Region })
  const s3 = new S3({ region: Region })

  const getResources = retry(api, api.getResources, Options.Defaults.override({ log }))
  const getBucketAcl = retry(
    s3,
    s3.getBucketAcl,
    Options.Defaults.override({ log, expectedErrors: ['NoSuchBucket'] })
  )

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
    const BucketName = ResourceARN.split(':').splice(-1)[0]

    await getBucketAcl({ Bucket: BucketName })
  } catch (error) {
    if (error != null && error.code === 'NoSuchBucket') {
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

export default getS3BucketByTags
