import IAM from 'aws-sdk/clients/iam'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      PolicyName: string
      RoleName: string
      PolicyDocument: {
        Version: string
        Statement: Array<{
          Action: string | Array<string>
          Resource: string | Array<string>
          Effect: 'Allow' | 'Deny'
        }>
      }
    },
    log?: Log
  ): Promise<void>
}

const putRolePolicy: TMethod = async (
  { Region, RoleName, PolicyName, PolicyDocument },
  log = getLog('PUT-ROLE-POLICY')
) => {
  const iam = new IAM({ region: Region })

  try {
    log.debug(`Put the role "${RoleName}" policy "${PolicyName}"`)

    const ensureRolePolicy = retry(iam, iam.putRolePolicy, Options.Defaults.override({ log }))
    await ensureRolePolicy({
      PolicyName,
      RoleName,
      PolicyDocument: JSON.stringify(PolicyDocument),
    })
  } catch (error) {
    log.debug(`Failed to put the role "${RoleName}" policy "${PolicyName}"`)
    throw error
  }

  log.debug(`The role "${RoleName}" policy "${PolicyName}" has been putted`)
}

export default putRolePolicy
