import IAM, { Tag as RoleTag } from 'aws-sdk/clients/iam'

import { createRole, putRolePolicy, getTags } from './createRoleWithPolicy'
import { retry, Options, getLog, Log } from '../utils'

const updateAssumeRolePolicy = async (
  params: {
    Region: string
    RoleName: string
    PolicyDocument: Record<string, any>
  },
  log: Log
): Promise<void> => {
  const { Region, RoleName, PolicyDocument } = params

  const iam = new IAM({ region: Region })

  const setAssumeRolePolicy = retry(
    iam,
    iam.updateAssumeRolePolicy,
    Options.Defaults.override({ log })
  )
  await setAssumeRolePolicy({
    RoleName,
    PolicyDocument: JSON.stringify(PolicyDocument)
  })
}

const updateRole = async (
  params: {
    Region: string
    RoleName: string
    Description?: string
  },
  log: Log
): Promise<void> => {
  const { Region, RoleName, Description } = params

  const iam = new IAM({ region: Region })

  const setRole = retry(iam, iam.updateRole, Options.Defaults.override({ log }))
  await setRole({
    RoleName,
    Description
  })
}

const tagRole = async (
  params: {
    Region: string
    RoleName: string
    Tags: Array<{ Key: string; Value: string }>
  },
  log: Log
): Promise<void> => {
  const { Region, RoleName, Tags } = params

  const iam = new IAM({ region: Region })

  const addTags = retry(iam, iam.tagRole, Options.Defaults.override({ log, maxAttempts: 1 }))
  await addTags({
    RoleName,
    Tags
  })
}

const untagRole = async (
  params: {
    Region: string
    RoleName: string
    TagKeys: Array<string>
  },
  log: Log
): Promise<void> => {
  const { Region, RoleName, TagKeys } = params

  const iam = new IAM({ region: Region })

  const removeTags = retry(iam, iam.untagRole, Options.Defaults.override({ log, maxAttempts: 1 }))
  await removeTags({
    RoleName,
    TagKeys
  })
}

const ensureRole = async (
  params: {
    Region: string
    AssumeRolePolicyDocument: Record<string, any>
    RoleName: string
    Description: string
    Tags: Array<RoleTag>
  },
  log: Log
): Promise<{ Arn: string; IsCreated: boolean }> => {
  const { Region, AssumeRolePolicyDocument, RoleName, Description, Tags } = params

  try {
    log.debug(`Find RoleArn by RoleName "${RoleName}"`)

    const iam = new IAM({ region: Region })

    const getRole = retry(
      iam,
      iam.getRole,
      Options.Defaults.override({ log, silent: true, maxAttempts: 1 })
    )
    const {
      Role: { Arn, Tags: prevTags = [] }
    } = await getRole({ RoleName })

    log.debug(`RoleArn ${JSON.stringify(Arn)} by RoleName "${RoleName}" has been found`)

    const nextTags = [...prevTags]
    for (const { Key, Value } of Tags) {
      const index = nextTags.findIndex(({ Key: PrevKey }) => PrevKey === Key)
      if (index >= 0) {
        nextTags[index] = { Key, Value }
      } else {
        nextTags.push({ Key, Value })
      }
    }

    const ensuredTags: Array<{ Key: string; Value: string }> = []
    const dropTags: Array<string> = []
    for (const { Key, Value } of nextTags) {
      const index = Tags.findIndex(({ Key: PrevKey }) => PrevKey === Key)

      if (index >= 0) {
        ensuredTags.push({ Key, Value })
      } else {
        dropTags.push(Key)
      }
    }
    log.verbose({
      prevTags,
      nextTags,
      ensuredTags,
      dropTags
    })

    log.debug(`Update tags`)
    await tagRole(
      {
        Region,
        RoleName,
        Tags: ensuredTags
      },
      log
    )
    log.debug(`Tags have been updated`)

    log.debug(`Delete tags`)
    await untagRole(
      {
        Region,
        RoleName,
        TagKeys: dropTags
      },
      log
    )
    log.debug(`Tags have been deleted`)

    log.debug(`Update assume the role policy`)
    await updateAssumeRolePolicy(
      {
        Region,
        RoleName,
        PolicyDocument: AssumeRolePolicyDocument
      },
      log
    )
    log.debug(`Assume the role policy has been updated`)

    log.debug(`Update the role`)
    await updateRole(
      {
        Region,
        RoleName,
        Description
      },
      log
    )
    log.debug(`The role has been updated`)

    return { Arn, IsCreated: false }
  } catch (error) {
    if (error.code !== 'NoSuchEntity') {
      throw error
    }

    log.debug(`Create a role`)
    const Arn = await createRole(
      {
        Region,
        AssumeRolePolicyDocument,
        RoleName,
        Description,
        Tags
      },
      log
    )
    log.debug(`The role with ARN ${Arn} has been created`)

    return { Arn, IsCreated: true }
  }
}

const deleteRolePolicy = async (
  params: {
    Region: string
    RoleName: string
    PolicyName: string
  },
  log: Log
): Promise<void> => {
  const { Region, RoleName, PolicyName } = params

  const iam = new IAM({ region: Region })

  const removeRolePolicy = retry(
    iam,
    iam.deleteRolePolicy,
    Options.Defaults.override({ log, maxAttempts: 1 })
  )
  await removeRolePolicy({
    RoleName,
    PolicyName
  })
}

interface ListRolePoliciesMethod {
  (params: { Region: string; RoleName: string }, log: Log): Promise<Array<string>>
}

interface ListRolePoliciesLoop {
  (
    callback: ListRolePoliciesLoop,
    params: { Region: string; RoleName: string; Marker?: string; Result?: Array<string> },
    log: Log
  ): Promise<Array<string>>
}

const listRolePoliciesLoop: ListRolePoliciesLoop = async (
  callback,
  { Region, RoleName, Marker, Result = [] },
  log
) => {
  const iam = new IAM({ region: Region })

  const getRolePolicies = retry(
    iam,
    iam.listRolePolicies,
    Options.Defaults.override({ log, maxAttempts: 1 })
  )
  const {
    PolicyNames = [],
    IsTruncated,
    Marker: NextMarker
  } = await getRolePolicies({
    RoleName,
    Marker
  })

  Result.push(...PolicyNames)

  if (IsTruncated) {
    return callback(callback, { Region, RoleName, Marker: NextMarker, Result }, log)
  }

  return Result
}

const listRolePolicies: ListRolePoliciesMethod = listRolePoliciesLoop.bind(
  null,
  listRolePoliciesLoop
)

const ensureRoleWithPolicy = async (
  params: {
    Region: string
    AssumeRolePolicyDocument: {
      Version: string
      Statement: Array<{
        Action: string | Array<string>
        Principal: {
          Service?: string | Array<string>
          AWS?: string | Array<string>
        }
        Effect: 'Allow' | 'Deny'
      }>
    }
    RoleName: string
    PolicyName: string
    PolicyDocument: {
      Version: string
      Statement: Array<{
        Action: string | Array<string>
        Resource: string | Array<string>
        Effect: 'Allow' | 'Deny'
      }>
    }
    Description?: string
    Tags?: { [Key: string]: string }
  },
  log = getLog('ENSURE-ROLE-WITH-POLICY')
): Promise<string> => {
  const {
    Region,
    AssumeRolePolicyDocument,
    RoleName,
    PolicyName,
    PolicyDocument,
    Description = '',
    Tags: RawTags = {}
  } = params

  const Tags = getTags(RawTags)

  log.verbose({
    Region,
    AssumeRolePolicyDocument,
    RoleName,
    PolicyName,
    PolicyDocument,
    Description,
    Tags
  })

  log.debug('Ensure the role')
  const { Arn, IsCreated } = await ensureRole(
    { Region, AssumeRolePolicyDocument, RoleName, Description, Tags },
    log
  )
  log.debug(`The role has been ensured with ARN ${JSON.stringify(Arn)}`)

  if (!IsCreated) {
    log.debug('Find a role policies')
    const rolePolicies = await listRolePolicies({ Region, RoleName }, log)
    log.debug('The role policies have been found')

    log.debug('Delete a role redundant policies')

    await Promise.all(
      rolePolicies.map((policyName) =>
        policyName !== PolicyName
          ? deleteRolePolicy(
              {
                Region,
                RoleName,
                PolicyName: policyName
              },
              log
            )
          : null
      )
    )

    log.debug('The role policies have been deleted')
  }

  log.debug('Put the policy')
  await putRolePolicy({ Region, RoleName, PolicyName, PolicyDocument }, log)
  log.debug('The policy has been put')

  const iam = new IAM({ region: Region })
  const getRole = retry(iam, iam.getRole, Options.Defaults.override({ log, silent: true }))

  log.debug('Waiting for role to be accessible')

  for (let retryIndex = 0; ; retryIndex++) {
    try {
      await getRole({ RoleName })
      break
    } catch (error) {
      if (retryIndex >= 5) {
        throw error
      }
    }
  }

  log.debug('Role is ready to use')

  return Arn
}

export default ensureRoleWithPolicy
