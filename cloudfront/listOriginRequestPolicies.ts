import CloudFront, { ListOriginRequestPoliciesResult } from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'

const listOriginRequestPolicies = async (
  params: {
    Region: string
  },
  log: Log = getLog('LIST-ORIGIN-REQUEST-PILICIES')
): Promise<ListOriginRequestPoliciesResult> => {
  const { Region } = params

  const cloudfront = new CloudFront({ region: Region })
  const listOriginRequestPoliciesExecution = retry(
    cloudfront,
    cloudfront.listOriginRequestPolicies,
    Options.Defaults.override({ log })
  )

  try {
    log.debug('Getting list origin request policies')

    const result = await listOriginRequestPoliciesExecution({})

    return result
  } catch (error) {
    log.error('Failed to get list origin request policies')
    throw error
  }
}

export default listOriginRequestPolicies
