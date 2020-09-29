import CloudFront from 'aws-sdk/clients/cloudfront'
import Resourcegroupstaggingapi from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, Log, getLog, ignoreNotFoundException } from '../utils'
import getCloudFrontDistributionById from './getCloudFrontDistributionById'

const deleteCloudFrontDistribution = async (
  params: {
    Region: string
    Id: string
    IfMatch?: string
    IfExists?: boolean
  },
  log: Log = getLog('DELETE-CLOUD-FRONT-DISTRIBUTION')
): Promise<void> => {
  const { Region, Id, IfMatch, IfExists } = params

  const cloudFront = new CloudFront({ region: Region })
  const taggingAPI = new Resourcegroupstaggingapi({ region: Region })

  try {
    log.debug('Delete cloud front distribution')

    const deleteDistribution = retry(
      cloudFront,
      cloudFront.deleteDistribution,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000
      })
    )
    const listTagsForResource = retry(
      cloudFront,
      cloudFront.listTagsForResource,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000
      })
    )

    const untagResources = retry(
      taggingAPI,
      taggingAPI.untagResources,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000
      })
    )

    const { Distribution: { ARN } = {} } = await getCloudFrontDistributionById({ Region, Id })
    if (ARN == null) {
      throw new Error(`CloudFront distribution ARN Not found for ID=${Id}`)
    }
    const { Tags: TagsWithItems } = await listTagsForResource({ Resource: ARN })

    await deleteDistribution({
      Id,
      IfMatch
    })

    try {
      if (TagsWithItems != null && TagsWithItems.Items != null) {
        const TagKeys = TagsWithItems.Items.map(({ Key }) => Key)

        if (TagKeys.length > 0) {
          await untagResources({
            ResourceARNList: [ARN],
            TagKeys
          })
        }

        log.debug(`Cloud front distribution tags has been deleted`)
        log.verbose({ TagKeys })
      }
    } catch (error) {
      log.warn(error)
    }

    log.debug('Cloud front distribution successfully deleted')
  } catch (error) {
    if (IfExists) {
      log.error('Skip delete cloud front distribution')
      ignoreNotFoundException(error)
    } else {
      log.error('Failed to delete cloud front distribution')
      throw error
    }
  }
}

export default deleteCloudFrontDistribution
