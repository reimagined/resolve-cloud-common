import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, ignoreNotFoundException, Log } from '../utils'
import { DEFAULT_REGION } from './constants'

const deleteCloudFrontOriginAccessIdentity = async (
  params: {
    Region?: 'us-east-1'
    Id: string
    IfMatch?: string
    IfExists?: boolean
  },
  log: Log = getLog('DELETE-CLOUD-FRONT-ORIGIN-ACCESS-IDENTITY')
): Promise<void> => {
  const { Region = DEFAULT_REGION, Id, IfMatch, IfExists } = params

  const cloudFront = new CloudFront({ region: Region })

  try {
    log.debug('Delete cloud front origin access identity')

    const deleteOriginAccessIdentity = retry(
      cloudFront,
      cloudFront.deleteCloudFrontOriginAccessIdentity,
      Options.Defaults.override({ maxAttempts: 5, delay: 1000, log })
    )

    await deleteOriginAccessIdentity({
      Id,
      IfMatch
    })

    log.debug('Cloud front origin access identity deleted')
  } catch (error) {
    if (IfExists) {
      log.error('Skip delete cloud front origin access identity')
      ignoreNotFoundException(error)
    } else {
      log.error('Failed to delete cloud front origin access identity')
      throw error
    }
  }
}

export default deleteCloudFrontOriginAccessIdentity
