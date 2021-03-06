import CloudFront, { ListCloudFrontOriginAccessIdentitiesResult } from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'
import { DEFAULT_REGION } from './constants'

const listCloudFrontOriginAccessIdentities = async (
  params: {
    Region?: 'us-east-1'
    Marker?: string
    MaxItems?: string
  },
  log: Log = getLog('LIST-CLOUD-FRONT-ORIGIN-ACCESS-IDENTITIES')
): Promise<ListCloudFrontOriginAccessIdentitiesResult> => {
  const { Region = DEFAULT_REGION, Marker, MaxItems = '200' } = params

  const cloudFront = new CloudFront({ region: Region })

  try {
    log.debug('list access identities')

    const listCloudFrontOriginAccessIdentitiesResult = retry(
      cloudFront,
      cloudFront.listCloudFrontOriginAccessIdentities,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000,
        log
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
