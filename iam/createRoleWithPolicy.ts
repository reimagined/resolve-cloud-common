import IAM, { Tag as RoleTag } from 'aws-sdk/clients/iam'

import { retry, Options, getLog, Log } from '../utils'

export const createRole = async (
  params: {
    Region: string
    AssumeRolePolicyDocument: Record<string, any>
    RoleName: string
    Description?: string
    Tags: Array<RoleTag>
  },
  log: Log
): Promise<string> => {
  const { Region, AssumeRolePolicyDocument, RoleName, Description, Tags } = params

  const iam = new IAM({ region: Region })

  const addRole = retry(iam, iam.createRole, Options.Defaults.override({ log, maxAttempts: 1 }))
  const {
    Role: { Arn }
  } = await addRole({
    AssumeRolePolicyDocument: JSON.stringify(AssumeRolePolicyDocument),
    RoleName,
    Description,
    Tags
  })

  return Arn
}

export const putRolePolicy = async (
  params: {
    Region: string
    RoleName: string
    PolicyName: string
    PolicyDocument: Record<string, any>
  },
  log: Log
): Promise<void> => {
  const { Region, RoleName, PolicyName, PolicyDocument } = params

  const iam = new IAM({ region: Region })

  const addRolePolicy = retry(
    iam,
    iam.putRolePolicy,
    Options.Defaults.override({ log, maxAttempts: 1 })
  )
  await addRolePolicy({
    RoleName,
    PolicyName,
    PolicyDocument: JSON.stringify(PolicyDocument)
  })
}

export const getTags = (Tags: Record<string, string>): Array<{ Key: string; Value: string }> =>
  Array.from(Object.entries({ ...Tags, Owner: 'reimagined' })).map(([Key, Value]) => ({
    Key,
    Value
  }))

const createRoleWithPolicy = async (
  params: {
    Region: string
    AssumeRolePolicyDocument: {
      Version: string
      Statement: Array<{
        Action: string | Array<string>
        Principal: {
          Service: string | Array<string>
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
  log = getLog('CREATE-ROLE-WITH-POLICY')
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

  log.debug('Create the role')
  const Arn = await createRole(
    {
      Region,
      Description,
      RoleName,
      Tags,
      AssumeRolePolicyDocument
    },
    log
  )

  log.debug(`The role has been created with ARN ${Arn}`)

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

export default createRoleWithPolicy
