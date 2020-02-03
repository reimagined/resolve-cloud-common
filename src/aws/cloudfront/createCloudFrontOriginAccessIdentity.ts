import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, Log, getLog } from '../../utils';

interface TResponse {
  Id: string,
  S3CanonicalUserId: string
}

interface TMethod {
  (
    params: {
      Region: string
      Comment: string
    },
    log?: Log
  ): Promise<TResponse>
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
      Options.Defaults.override({maxAttempts: 5, delay: 1000})
    )

    const {
      CloudFrontOriginAccessIdentity
    } = await createCloudFrontAccessIdentity({
      CloudFrontOriginAccessIdentityConfig: {
        CallerReference: Comment,
        Comment
      }
    })

    if (CloudFrontOriginAccessIdentity == null) {
      throw new Error('CloudFrontOriginAccessIdentity not found')
    }

    log.debug('Cloud front origin access identity created')

    const { Id, S3CanonicalUserId } = CloudFrontOriginAccessIdentity

    return {
      Id,
      S3CanonicalUserId
    }
  } catch (error) {
    log.error('Cloud front origin access identity creation failed')
    throw error
  }
}

export default createCloudFrontOriginAccessIdentity
