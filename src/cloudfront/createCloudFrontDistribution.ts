import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'

interface TResponse {
  DomainName: string
}

interface TMethod {
  (
    params: {
      Region: string
      DistributionConfig: string
      Tags: object
    },
    log?: Log
  ): Promise<TResponse>
}

const createCloudFrontDistribution: TMethod = async (
  { Region, DistributionConfig, Tags },
  log = getLog(`CREATE-CLOUD-FRONT-DISTRIBUTION`)
) => {
  const cf = new CloudFront({ region: Region })

  try {
    log.debug(`Create cloud front distribution with tags`)

    const createDistributionWithTags = retry(
      cf,
      cf.createDistributionWithTags,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000
      })
    )

    const { Distribution } = await createDistributionWithTags({
      DistributionConfigWithTags: {
        DistributionConfig,
        Tags
      }
    })

    if (Distribution == null) {
      throw new Error('Unknown resource distribution')
    }

    const { DomainName } = Distribution

    return {
      DomainName
    }
  } catch (error) {
    log.error(`Failed to create cloud front distribution`)
    throw error
  }
}

export default createCloudFrontDistribution
