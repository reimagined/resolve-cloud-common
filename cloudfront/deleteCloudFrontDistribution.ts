import CloudFront from 'aws-sdk/clients/cloudfront'
import Resourcegroupstaggingapi from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, Log, getLog, ignoreNotFoundException } from '../utils'
import getCloudFrontDistributionById from './getCloudFrontDistributionById'
import { DEFAULT_REGION } from './constants'

const deleteCloudFrontDistribution = async (
  params: {
    Region?: 'us-east-1'
    Id: string
    IfMatch?: string
    IfExists?: boolean
  },
  log: Log = getLog('DELETE-CLOUD-FRONT-DISTRIBUTION')
): Promise<void> => {
  const { Region = DEFAULT_REGION, Id, IfMatch, IfExists } = params

  const cloudFront = new CloudFront({ region: Region })
  const taggingAPI = new Resourcegroupstaggingapi({ region: Region })

  const deleteDistribution = retry(
    cloudFront,
    cloudFront.deleteDistribution,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000,
      log
    })
  )

  const untagResources = retry(
    taggingAPI,
    taggingAPI.untagResources,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000,
      log
    })
  )

  try {
    log.debug('Delete cloud front distribution')

    const { Distribution, Tags } = await getCloudFrontDistributionById({ Region, Id })

    const TagKeys = Object.keys(Tags)

    await deleteDistribution({
      Id,
      IfMatch
    })

    try {
      if (TagKeys.length > 0) {
        await untagResources({
          ResourceARNList: [Distribution.ARN],
          TagKeys
        })
      }

      log.debug(`Cloud front distribution tags has been deleted`)
      log.verbose({ TagKeys })
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
