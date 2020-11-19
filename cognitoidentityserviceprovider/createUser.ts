import CognitoIdentityServiceProvider, {
  AdminCreateUserResponse
} from 'aws-sdk/clients/cognitoidentityserviceprovider'

import getUserByEmail from './getUserByEmail'
import { ADMIN_GROUP_NAME, CognitoUser } from './constants'
import { retry, Options, getLog, Log, isAlreadyExistsException } from '../utils'

const createUser = async (
  params: {
    Region: string
    UserPoolArn: string
    Email: string
    TemporaryPassword: string
    ForceAliasCreation?: boolean
    MessageAction?: 'RESEND' | 'SUPPRESS'
    ClientMetadata?: Record<string, string>
    DesiredDeliveryMediums?: Array<'SMS' | 'EMAIL'>
    UserAttributes?: Array<{ Name: string; Value: string }>
    ValidationData?: Array<{ Name: string; Value: string }>
    IsAdmin?: boolean
    IfNotExists?: boolean
  },
  log: Log = getLog('CREATE_USER')
): Promise<CognitoUser> => {
  const {
    Region,
    UserPoolArn,
    Email,
    ClientMetadata,
    DesiredDeliveryMediums,
    ForceAliasCreation,
    MessageAction,
    TemporaryPassword,
    UserAttributes,
    ValidationData,
    IsAdmin = false,
    IfNotExists = false
  } = params
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({ region: Region })

  const adminCreateUserExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.adminCreateUser,
    Options.Defaults.override({ log, expectedErrors: ['UsernameExistsException'] })
  )

  const adminAddUserToGroupExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.adminAddUserToGroup,
    Options.Defaults.override({ log })
  )

  const UserPoolId: string | null = UserPoolArn.split('/').slice(-1)[0]
  if (UserPoolId == null || UserPoolId === '') {
    throw new Error(`Invalid UserPoolArn "${UserPoolArn}"`)
  }

  let createUserResult: AdminCreateUserResponse

  try {
    createUserResult = await adminCreateUserExecutor({
      UserPoolId,
      Username: Email,
      ClientMetadata,
      DesiredDeliveryMediums,
      ForceAliasCreation,
      MessageAction,
      TemporaryPassword,
      UserAttributes,
      ValidationData
    })
  } catch (error) {
    if (IfNotExists && isAlreadyExistsException(error)) {
      return getUserByEmail(
        {
          Region,
          UserPoolArn,
          Email
        },
        log
      )
    } else {
      throw error
    }
  }

  if (createUserResult == null || createUserResult.User == null) {
    throw new Error(`Failed to create user`)
  }

  const { User: { Username: UserId, Enabled, UserStatus } = {} } = createUserResult

  if (IsAdmin === true) {
    const addUserResult = await adminAddUserToGroupExecutor({
      UserPoolId,
      Username: Email,
      GroupName: ADMIN_GROUP_NAME
    })

    if (addUserResult == null) {
      throw new Error(`Failed to create admin user`)
    }
  }

  if (UserId == null) {
    throw new Error('Empty "UserId"')
  }
  if (UserStatus == null) {
    throw new Error('Empty "UserStatus"')
  }
  if (Enabled == null) {
    throw new Error('Empty "Enabled"')
  }

  return {
    UserId,
    Email,
    IsAdmin,
    Enabled,
    UserStatus
  }
}

export default createUser
