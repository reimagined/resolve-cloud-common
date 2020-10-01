import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, NotFoundError, Log } from '../utils'
import { DEFAULT_REGION } from './constants'

const createCloudFrontOriginAccessIdentity = async (
  params: {
    Region?: 'us-east-1'
    Comment: string
  },
  log: Log = getLog('CREATE-CLOUD-FRONT-ORIGIN-ACCESS-IDENTITY')
): Promise<{
  Id: string
  S3CanonicalUserId: string
}> => {
  const { Region = DEFAULT_REGION, Comment } = params

  const cloudFront = new CloudFront({ region: Region })

  try {
    log.debug('Create cloud front origin access identity')

    const createCloudFrontAccessIdentity = retry(
      cloudFront,
      cloudFront.createCloudFrontOriginAccessIdentity,
      Options.Defaults.override({ maxAttempts: 5, delay: 1000, log })
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

    return {
      Id: CloudFrontOriginAccessIdentity.Id,
      S3CanonicalUserId: CloudFrontOriginAccessIdentity.S3CanonicalUserId
    }
  } catch (error) {
    log.error('Cloud front origin access identity creation failed')
    throw error
  }
}

export default createCloudFrontOriginAccessIdentity
