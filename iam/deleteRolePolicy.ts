import IAM from 'aws-sdk/clients/iam'

import { retry, Options, getLog, ignoreNotFoundException } from '../utils'

const deleteRolePolicy = async (
  params: {
    Region: string
    RoleName: string
    PolicyName: string
    IfExists?: boolean
  },
  log = getLog('DELETE-ROLE-POLICY')
): Promise<void> => {
  const { Region, RoleName, PolicyName, IfExists } = params

  const iam = new IAM({ region: Region })

  const getRolePolicy = retry(
    iam,
    iam.getRolePolicy,
    Options.Defaults.override({ log, expectedErrors: ['NoSuchEntity'] })
  )

  const deleteRolePolicyExecutor = retry(
    iam,
    iam.deleteRolePolicy,
    Options.Defaults.override({ log, expectedErrors: ['NoSuchEntity'] })
  )

  try {
    log.debug(`Delete the role "${RoleName}" inline policy "${PolicyName}"`)

    const { PolicyDocument } = await getRolePolicy({
      RoleName,
      PolicyName
    })

    if (PolicyDocument == null) {
      const error: Error & { code?: string } = new Error('IAM role inline policy not found')
      error.code = 'ResourceNotFoundException'
      throw error
    }

    await deleteRolePolicyExecutor({ RoleName, PolicyName })

    log.debug(`The the role "${RoleName}" inline policy "${PolicyName}" has been deleted`)
  } catch (error) {
    if (IfExists) {
      log.error(`Skip delete the role "${RoleName}" inline policy "${PolicyName}"`)
      ignoreNotFoundException(error)
    } else {
      log.error(`Failed to delete the role "${RoleName}" inline policy "${PolicyName}"`)
      throw error
    }
  }
}

export default deleteRolePolicy
