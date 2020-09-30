import CloudFront, {
  DistributionConfig as CloudFrontDistributionConfig,
  Distribution as CloudFrontDistribution
} from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log, NotFoundError } from '../utils'

const createCloudFrontDistribution = async (
  params: {
    Region: string
    DistributionConfig: CloudFrontDistributionConfig
    Tags?: Record<string, string>
  },
  log: Log = getLog(`CREATE-CLOUD-FRONT-DISTRIBUTION`)
): Promise<CloudFrontDistribution> => {
  const { Region, DistributionConfig, Tags = {} } = params

  Tags.Owner = 'reimagined'

  const cf = new CloudFront({ region: Region })

  try {
    log.debug(`Create cloud front distribution with tags`)

    const createDistributionWithTags = retry(
      cf,
      cf.createDistributionWithTags,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000,
        log
      })
    )

    const { Distribution } = await createDistributionWithTags({
      DistributionConfigWithTags: {
        DistributionConfig,
        Tags: {
          Items: Object.entries(Tags).map(([Key, Value]) => ({ Key, Value }))
        }
      }
    })

    if (Distribution == null) {
      throw new NotFoundError('Unknown resource distribution', 'NoSuchDistribution')
    }

    return Distribution
  } catch (error) {
    log.error(`Failed to create cloud front distribution`)
    throw error
  }
}

export default createCloudFrontDistribution
