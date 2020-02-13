import IAM from 'aws-sdk/clients/iam'

import { retry, Options, getLog, Log } from '../../utils'

const processPage = async (
  params: { Region: string; RoleName: string },
  log: Log,
  page?: object
): Promise<void> => {
  const { Region, RoleName } = params

  const iam = new IAM({ region: Region })

  log.debug(`List the role inline policies`)

  const listRolePolicies = retry(iam, iam.listRolePolicies, Options.Defaults.override({ log }))
  const result = await listRolePolicies({ RoleName, ...page })

  const deleteRolePolicy = retry(iam, iam.deleteRolePolicy, Options.Defaults.override({ log }))

  await Promise.all(
    result.PolicyNames.map(async PolicyName => {
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
    await processPage(params, log, { Marker })
  }
}

interface TMethod {
  (
    params: {
      Region: string
      RoleName: string
    },
    log?: Log
  ): Promise<void>
}

const deleteRole: TMethod = async ({ Region, RoleName }, log = getLog('DELETE-ROLE')) => {
  const iam = new IAM({ region: Region })

  log.debug(`Delete the role "${RoleName}"`)

  log.debug(`Enumerate and delete the role inline policies`)
  await processPage({ Region, RoleName }, log)

  log.debug(`Delete the role "${RoleName}" itself`)
  const removeRole = retry(iam, iam.deleteRole, Options.Defaults.override({ log }))
  await removeRole({ RoleName })

  log.debug(`The role "${RoleName}" has been deleted`)
}

export default deleteRole
