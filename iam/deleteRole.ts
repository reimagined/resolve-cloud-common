import IAM from 'aws-sdk/clients/iam'
import Resourcegroupstaggingapi from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteRolePolicies = async (
  params: { Region: string; RoleName: string },
  log: Log,
  page?: Record<string, any>
): Promise<void> => {
  const { Region, RoleName } = params

  const iam = new IAM({ region: Region })
  log.debug(`List the role inline policies`)

  const listRolePolicies = retry(
    iam,
    iam.listRolePolicies,
    Options.Defaults.override({ log, expectedErrors: ['NoSuchEntity'] })
  )
  const result = await listRolePolicies({ RoleName, ...page })

  const deleteRolePolicy = retry(
    iam,
    iam.deleteRolePolicy,
    Options.Defaults.override({ log, expectedErrors: ['NoSuchEntity'] })
  )

  await Promise.all(
    result.PolicyNames.map(async (PolicyName) => {
      log.debug(`Delete the role "${RoleName}" inline policy "${PolicyName}"`)

      await deleteRolePolicy({
        RoleName,
        PolicyName
      })

      log.debug(`The role "${RoleName}" inline policy "${PolicyName}" has been deleted`)
    })
  )

  const { IsTruncated, Marker } = result
  if (IsTruncated) {
    await deleteRolePolicies(params, log, { Marker })
  }
}

const deleteRole = async (
  params: {
    Region: string
    RoleName: string
    IfExists?: boolean
  },
  log = getLog('DELETE-ROLE')
): Promise<void> => {
  const { Region, RoleName, IfExists } = params

  const iam = new IAM({ region: Region })
  const taggingApi = new Resourcegroupstaggingapi({ region: Region })

  try {
    log.debug(`Delete the role "${RoleName}"`)

    log.debug(`Enumerate and delete the role inline policies`)
    await deleteRolePolicies({ Region, RoleName }, log)

    log.debug(`Delete the role "${RoleName}"`)
    const removeRole = retry(
      iam,
      iam.deleteRole,
      Options.Defaults.override({ log, expectedErrors: ['NoSuchEntity'] })
    )
    const getRole = retry(
      iam,
      iam.getRole,
      Options.Defaults.override({ log, expectedErrors: ['NoSuchEntity'] })
    )
    const untagResource = retry(
      taggingApi,
      taggingApi.untagResources,
      Options.Defaults.override({ log })
    )

    const {
      Role: { Arn, Tags }
    } = await getRole({ RoleName })
    if (Arn == null) {
      const error: Error & { code?: string } = new Error('IAM role not found')
      error.code = 'ResourceNotFoundException'
      throw error
    }

    await removeRole({ RoleName })

    try {
      if (Tags != null) {
        await untagResource({
          ResourceARNList: [Arn],
          TagKeys: Tags.map(({ Key }) => Key)
        })
      }
    } catch (error) {
      log.warn(error)
    }

    log.debug(`The role "${RoleName}" has been deleted`)
  } catch (error) {
    if (IfExists) {
      log.error(`Skip delete the role "${RoleName}"`)
      ignoreNotFoundException(error)
    } else {
      log.error(`Failed to delete the role "${RoleName}"`)
      throw error
    }
  }
}

export default deleteRole
