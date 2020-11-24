import CloudFront from 'aws-sdk/clients/cloudfront'
import listCloudFrontOriginAccessIdentities from './listCloudFrontOriginAccessIdentities'

import { Log, getLog, retry, Options } from '../utils'
import { DEFAULT_REGION } from './constants'

const getCloudFrontOriginAccessIdentity = async (
  params: {
    Region?: 'us-east-1'
    Comment: string
  },
  log: Log = getLog('GET-CLOUD-FRONT-ORIGIN-ACCESS-IDENTITY')
): Promise<{
  Id: string
  S3CanonicalUserId: string
  ETag: string | undefined
}> => {
  const { Region = DEFAULT_REGION, Comment } = params
  const cloudFront = new CloudFront({ region: Region })

  let Marker: string | undefined

  const getCloudFrontOriginAccessIdentityExecutor = retry(
    cloudFront,
    cloudFront.getCloudFrontOriginAccessIdentity,
    Options.Defaults.override({ maxAttempts: 5, delay: 1000, log })
  )

  try {
    log.debug('Get list of cloud front origin access identities')

    for (;;) {
      const { CloudFrontOriginAccessIdentityList } = await listCloudFrontOriginAccessIdentities({
        Region,
        Marker
      })

      if (CloudFrontOriginAccessIdentityList == null) {
        throw new Error('Unknown cloud front origin access identity list')
      }

      const { IsTruncated, NextMarker, Items = [] } = CloudFrontOriginAccessIdentityList

      Marker = NextMarker

      const identity = Items.find((item) => item.Comment === Comment)

      if (identity != null) {
        log.debug('Identity successfully found')
        const { ETag } = await getCloudFrontOriginAccessIdentityExecutor({
          Id: identity.Id
        })
        return {
          Id: identity.Id,
          S3CanonicalUserId: identity.S3CanonicalUserId,
          ETag
        }
      }

      if (NextMarker == null || NextMarker === '') {
        break
      }

      if (IsTruncated) {
        log.debug('List is truncated, get list using marker')
      } else {
        break
      }
    }

    log.debug('Identity is not found')
    throw new Error('Identity is not found')
  } catch (error) {
    log.error('Getting of identity is failed')
    throw error
  }
}

export default getCloudFrontOriginAccessIdentity
