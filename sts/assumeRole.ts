import STS, { Credentials as CredentialsType } from 'aws-sdk/clients/sts'

import { retry, getLog, Log, Options } from '../utils'

const assumeRole = async (
  params: {
    Region: string
    RoleArn: string
    RoleSessionName: string
    Policy: Record<string, any>
    DurationSeconds?: number
  },
  log: Log = getLog('ASSUME-ROLE')
): Promise<CredentialsType> => {
  const { Region, RoleArn, RoleSessionName, Policy, DurationSeconds } = params

  const sts = new STS({
    region: Region
  })

  const assumeRoleExecutor = retry(sts, sts.assumeRole, Options.Defaults.override({ log }))

  try {
    const { Credentials } = await assumeRoleExecutor({
      RoleArn,
      RoleSessionName,
      DurationSeconds,
      Policy: JSON.stringify(Policy)
    })

    if (Credentials == null) {
      throw new Error('Failed to create assumed role')
    }

    return Credentials
  } catch (error) {
    log.debug(error)
    throw error
  }
}

export default assumeRole
