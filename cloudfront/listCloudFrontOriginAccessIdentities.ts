import CloudFront, { ListCloudFrontOriginAccessIdentitiesResult } from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Marker?: string
      MaxItems?: string
    },
    log?: Log
  ): Promise<ListCloudFrontOriginAccessIdentitiesResult>
}

const listCloudFrontOriginAccessIdentities: TMethod = async (
  { Region, Marker, MaxItems = '200' },
  log = getLog('LIST-CLOUD-FRONT-ORIGIN-ACCESS-IDENTITIES')
) => {
  const cloudFront = new CloudFront({ region: Region })

  try {
    log.debug('list access identities')

    const listCloudFrontOriginAccessIdentitiesResult = retry(
      cloudFront,
      cloudFront.listCloudFrontOriginAccessIdentities,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000
      })
    )

    const result = await listCloudFrontOriginAccessIdentitiesResult({
      Marker,
      MaxItems
    })

    log.debug('list successfully got')

    return result
  } catch (error) {
    log.error('list getting is failed')
    throw error
  }
}

export default listCloudFrontOriginAccessIdentities
