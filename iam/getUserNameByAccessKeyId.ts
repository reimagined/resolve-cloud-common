import IAM from 'aws-sdk/clients/iam'

import { retry, Options, getLog, Log } from '../utils'

const getUserNameByAccessKeyId = async (
  params: {
    Region: string
    AccessKeyId: string
  },
  log: Log = getLog('GET-USER-NAME-BY-ACCESS-KEY-ID')
): Promise<string> => {
  const { Region, AccessKeyId } = params

  const iam = new IAM({ region: Region })

  try {
    const getAccessKeyLastUsed = retry(
      iam,
      iam.getAccessKeyLastUsed,
      Options.Defaults.override({ log })
    )
    const { UserName } = await getAccessKeyLastUsed({
      AccessKeyId
    })

    if (UserName == null) {
      throw new Error('User name not found')
    }

    return UserName
  } catch (error) {
    log.debug(`Failed to get user name by "${AccessKeyId}" accessKeyId`)
    throw error
  }
}

export default getUserNameByAccessKeyId
