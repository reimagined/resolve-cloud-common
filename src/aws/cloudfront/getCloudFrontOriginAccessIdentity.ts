import listCloudFrontOriginAccessIdentities from './listCloudFrontOriginAccessIdentities'

import { Log, getLog } from '../../utils'

interface IMethod {
  (
    params: {
      Region: string,
      Comment: string,
      Marker?: string
    },
    log?: Log
  ): Promise<{ id: string, s3UserId: string } | null>
}

const getCloudFrontOriginAccessIdentity: IMethod = async ({ Region, Comment, Marker }, log = getLog('GET-CLOUD-FRONT-ORIGIN-ACCESS-IDENTITY')) => {
  try {
    log.debug('get list of cloud front origin access identities')

    const { CloudFrontOriginAccessIdentityList } = await listCloudFrontOriginAccessIdentities({
      Region,
      Marker
    })

    if (CloudFrontOriginAccessIdentityList == null) {
      throw new Error('Unknown cloud front origin access identity list')
    }

    const { IsTruncated, NextMarker, Items = [] } = CloudFrontOriginAccessIdentityList

    const identity = Items.find(item => item.Comment === Comment)

    if (identity != null) {
      log.debug('identity successfully found')

      return {
        id: identity.Id,
        s3UserId: identity.S3CanonicalUserId
      }
    }

    if (IsTruncated) {
      log.debug('list is truncated, get list using marker')

      return await getCloudFrontOriginAccessIdentity({
        Region,
        Comment,
        Marker: NextMarker
      })
    }

    log.debug('identity is not found')
    return null
  } catch (error) {
    log.error('getting of identity is failed')
    throw error
  }
}

export default getCloudFrontOriginAccessIdentity
