import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, Log, getLog } from '../utils'

const deleteCloudFrontDistribution = async (
  params: {
    Region: string
    Id: string
    IfMatch?: string
  },
  log: Log = getLog('DELETE-CLOUD-FRONT-DISTRIBUTION')
): Promise<void> => {
  const { Region, Id, IfMatch } = params

  const cloudFront = new CloudFront({ region: Region })

  try {
    log.debug('Delete cloud front distribution')

    const deleteDistribution = retry(
      cloudFront,
      cloudFront.deleteDistribution,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000
      })
    )

    await deleteDistribution({
      Id,
      IfMatch
    })

    log.debug('Cloud front distribution successfully deleted')
  } catch (error) {
    log.error('Failed to delete cloud front distribution')
    throw error
  }
}

export default deleteCloudFrontDistribution
