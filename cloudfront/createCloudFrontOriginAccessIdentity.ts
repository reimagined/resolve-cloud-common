import CloudFront, {
  CloudFrontOriginAccessIdentity as AccessIdentity
} from 'aws-sdk/clients/cloudfront'

import { retry, Options, Log, getLog, NotFoundError } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Comment: string
    },
    log?: Log
  ): Promise<AccessIdentity>
}

const createCloudFrontOriginAccessIdentity: TMethod = async (
  { Region, Comment },
  log = getLog('CREATE-CLOUD-FRONT-ORIGIN-ACCESS-IDENTITY')
) => {
  const cloudFront = new CloudFront({ region: Region })

  try {
    log.debug('Create cloud front origin access identity')

    const createCloudFrontAccessIdentity = retry(
      cloudFront,
      cloudFront.createCloudFrontOriginAccessIdentity,
      Options.Defaults.override({ maxAttempts: 5, delay: 1000 })
    )

    const { CloudFrontOriginAccessIdentity } = await createCloudFrontAccessIdentity({
      CloudFrontOriginAccessIdentityConfig: {
        CallerReference: Comment,
        Comment
      }
    })

    if (CloudFrontOriginAccessIdentity == null) {
      throw new NotFoundError(
        'CloudFrontOriginAccessIdentity was not found',
        'NoSuchCloudFrontOriginAccessIdentity'
      )
    }

    log.debug('Cloud front origin access identity created')

    return CloudFrontOriginAccessIdentity
  } catch (error) {
    log.error('Cloud front origin access identity creation failed')
    throw error
  }
}

export default createCloudFrontOriginAccessIdentity
