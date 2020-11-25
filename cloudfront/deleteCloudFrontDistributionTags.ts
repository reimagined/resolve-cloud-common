import CloudFront from 'aws-sdk/clients/cloudfront'

import getCloudFrontDistributionById from './getCloudFrontDistributionById'

import { retry, Options, getLog, Log } from '../utils'
import { DEFAULT_REGION } from './constants'

const deleteCloudFrontDistributionTags = async (
  params: {
    Region?: 'us-east-1'
    Id: string
    TagKeys: Array<string>
  },
  log: Log = getLog('DELETE-CLOUD-FRONT-DISTRIBUTION-TAGS')
): Promise<void> => {
  const { Region = DEFAULT_REGION, Id, TagKeys } = params

  const cloudFront = new CloudFront({ region: Region })

  const untagResource = retry(
    cloudFront,
    cloudFront.untagResource,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000,
      log
    })
  )

  try {
    log.debug('untag distribution')

    const { Distribution } = await getCloudFrontDistributionById({
      Region,
      Id
    })

    await untagResource({
      Resource: Distribution.ARN,
      TagKeys: {
        Items: TagKeys
      }
    })

    log.debug('distribution untagged')
  } catch (error) {
    log.error('distribution untagging is failed')
    throw error
  }
}

export default deleteCloudFrontDistributionTags
