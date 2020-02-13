import CloudFront, { Distribution } from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../../utils'

interface IMethod {
  (
    params: {
      Region: string,
      Id: string
    },
    log?: Log
  ): Promise<{ Distribution?: Distribution, ETag?: string }>
}

const getCloudFrontDistributionById: IMethod = async ({ Region, Id }, log = getLog('GET-CLOUD-FRONT-DISTRIBUTION-BY-ID')) => {
  const cloudFront = new CloudFront({ region: Region })

  try {
    log.debug('get distribution')

    const getDistribution = retry(cloudFront, cloudFront.getDistribution, Options.Defaults.override({
      maxAttempts: 5, delay: 1000
    }))

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
