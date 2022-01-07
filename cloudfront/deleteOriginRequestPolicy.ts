import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'

const deleteOriginRequestPolicy = async (
  params: {
    Region: string
    Id: string
  },
  log: Log = getLog('DELETE-ORIGIN-REQUEST-POLICY')
): Promise<void> => {
  const { Region, Id } = params

  const cloudfront = new CloudFront({ region: Region })

  const deleteOriginRequestPolicyExecutor = retry(
    cloudfront,
    cloudfront.deleteOriginRequestPolicy,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Delete origin request policy "${Id}"`)

    await deleteOriginRequestPolicyExecutor({ Id })

    log.debug(`Origin request policy "${Id}" has been deleted`)
  } catch (error) {
    log.error(`Failed to delete "${Id}" origin request policy`)
    throw error
  }
}

export default deleteOriginRequestPolicy
