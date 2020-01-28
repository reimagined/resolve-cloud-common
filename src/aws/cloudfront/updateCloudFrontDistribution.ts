import CloudFront, { DistributionConfig, Distribution } from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../../utils'

interface IMethod {
  (
    params: {
      Region: string,
      DistributionConfig: DistributionConfig,
      Id: string,
      IfMatch: boolean
    },
    log?: Log
  ): Promise<{ Distribution?: Distribution, ETag?: string }>
}

const updateCloudFrontDistribution: IMethod = async ({ Region, DistributionConfig, Id, IfMatch }, log = getLog('UPDATE-CLOUD-FRONT-DISTRIBUTION')) => {
  const cloudFront = new CloudFront({ region: Region })

  const updateDistribution = retry(cloudFront, cloudFront.updateDistribution, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  return updateDistribution({
    DistributionConfig,
    Id,
    IfMatch
  })
}

export default updateCloudFrontDistribution
