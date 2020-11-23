import CloudFront from 'aws-sdk/clients/cloudfront'

import getCloudFrontDistributionById from './getCloudFrontDistributionById'

import { retry, Options, getLog, Log } from '../utils'
import { DEFAULT_REGION } from './constants'

const setCloudFrontDistributionTags = async (
  params: {
    Region?: 'us-east-1'
    Id: string
    Tags: Record<string, string>
  },
  log: Log = getLog('SET-CLOUD-FRONT-DISTRIBUTION-TAGS')
): Promise<void> => {
  const { Region = DEFAULT_REGION, Id, Tags } = params

  const cloudFront = new CloudFront({ region: Region })

  const tagResource = retry(
    cloudFront,
    cloudFront.tagResource,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000,
      log
    })
  )

  try {
    log.debug('tag distribution')

    const { Distribution } = await getCloudFrontDistributionById({
      Region,
      Id
    })

    if (Distribution == null) {
      throw new Error(`Cloudfront distribution with "${Id}" id not found`)
    }

    await tagResource({
      Resource: Distribution.ARN,
      Tags: {
        Items: Object.entries(Tags).map(([Key, Value]) => ({ Key, Value }))
      }
    })

    log.debug('distribution tagged')
  } catch (error) {
    log.error('distribution tagging is failed')
    throw error
  }
}

export default setCloudFrontDistributionTags
