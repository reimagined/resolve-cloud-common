import listCloudFrontOriginAccessIdentities from './listCloudFrontOriginAccessIdentities'

import { Log, getLog } from '../utils'

const getCloudFrontOriginAccessIdentity = async (
  params: {
    Region: string
    Comment: string
  },
  log: Log = getLog('GET-CLOUD-FRONT-ORIGIN-ACCESS-IDENTITY')
): Promise<{
  Id: string
  S3CanonicalUserId: string
}> => {
  const { Region, Comment } = params

  let Marker: string | undefined

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

        return {
          Id: identity.Id,
          S3CanonicalUserId: identity.S3CanonicalUserId
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
