import STS, { GetCallerIdentityResponse } from 'aws-sdk/clients/sts'

import { retry, getLog, Log, Options } from '../utils'

const getCallerIdentity = async (
  params: {
    Region: string
  },
  log: Log = getLog('GET_CALLER_IDENTITY')
): Promise<GetCallerIdentityResponse> => {
  const { Region } = params

  const sts = new STS({
    region: Region
  })

  const getCallerIdentityExecutor = retry(
    sts,
    sts.getCallerIdentity,
    Options.Defaults.override({ log })
  )

  try {
    const result = await getCallerIdentityExecutor({})

    if (result == null) {
      throw new Error('Failed to get caller identity')
    }

    return result
  } catch (error) {
    log.debug(error)
    throw error
  }
}

export default getCallerIdentity
