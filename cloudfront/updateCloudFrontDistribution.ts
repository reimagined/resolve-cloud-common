import CloudFront, { DistributionConfig as Config, Distribution } from 'aws-sdk/clients/cloudfront'

import { retry, Options, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      DistributionConfig: Config
      Id: string
      IfMatch: boolean
    },
    log?: Log
  ): Promise<{ Distribution?: Distribution; ETag?: string }>
}

const updateCloudFrontDistribution: TMethod = async ({
  Region,
  DistributionConfig,
  Id,
  IfMatch
}) => {
  const cloudFront = new CloudFront({ region: Region })

  const updateDistribution = retry(
    cloudFront,
    cloudFront.updateDistribution,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000
    })
  )

  return updateDistribution({
    DistributionConfig,
    Id,
    IfMatch
  })
}

export default updateCloudFrontDistribution
