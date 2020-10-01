import CloudFront, { GetDistributionResult } from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'
import { DEFAULT_REGION } from './constants'

const getCloudFrontDistributionById = async (
  params: {
    Region?: 'us-east-1'
    Id: string
  },
  log: Log = getLog('GET-CLOUD-FRONT-DISTRIBUTION-BY-ID')
): Promise<GetDistributionResult> => {
  const { Region = DEFAULT_REGION, Id } = params

  const cloudFront = new CloudFront({ region: Region })

  try {
    log.debug('get distribution')

    const getDistribution = retry(
      cloudFront,
      cloudFront.getDistribution,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000,
        log
      })
    )

    const result = await getDistribution({
      Id
    })

    log.debug('distribution found')

    return result
  } catch (error) {
    log.error('distribution getting is failed')
    throw error
  }
}

export default getCloudFrontDistributionById
