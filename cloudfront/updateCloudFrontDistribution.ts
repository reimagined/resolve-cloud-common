import CloudFront, {
  DistributionConfig as Config,
  UpdateDistributionResult
} from 'aws-sdk/clients/cloudfront'

import { retry, Options, Log, getLog } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      DistributionConfig: Config
      Id: string
      IfMatch?: string
    },
    log?: Log
  ): Promise<UpdateDistributionResult>
}

const updateCloudFrontDistribution: TMethod = async (
  { Region, DistributionConfig, Id, IfMatch },
  log = getLog('UPDATE-CLOUD-FRONT-DISTRIBUTION')
) => {
  const cloudFront = new CloudFront({ region: Region })

  try {
    log.debug('Update cloud front distribution')

    const updateDistribution = retry(
      cloudFront,
      cloudFront.updateDistribution,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000
      })
    )

    const result = await updateDistribution({
      DistributionConfig,
      Id,
      IfMatch
    })

    log.debug('Cloud front distribution successfully updated')

    return result
  } catch (error) {
    log.error('Failed to update cloud front distribution')
    throw error
  }
}

export default updateCloudFrontDistribution
