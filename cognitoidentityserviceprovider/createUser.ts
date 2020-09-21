import CognitoIdentityServiceProvider, {
  UserType
} from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { ADMIN_GROUP_NAME } from './constants'
import { retry, Options, getLog, Log } from '../utils'

const createUser = async (
  params: {
    Region: string
    UserPoolArn: string
    Username: string
    TemporaryPassword: string
    ForceAliasCreation?: boolean
    MessageAction?: 'RESEND' | 'SUPPRESS'
    ClientMetadata?: { [key: string]: string }
    DesiredDeliveryMediums?: Array<'SMS' | 'EMAIL'>
    UserAttributes?: Array<{ Name: string; Value: string }>
    ValidationData?: Array<{ Name: string; Value: string }>
    IsAdmin?: boolean
  },
  log: Log = getLog('CREATE_USER')
): Promise<UserType> => {
  const {
    Region,
    UserPoolArn,
    Username,
    ClientMetadata,
    DesiredDeliveryMediums,
    ForceAliasCreation,
    MessageAction,
    TemporaryPassword,
    UserAttributes,
    ValidationData,
    IsAdmin
  } = params
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({ region: Region })

  const adminCreateUserExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.adminCreateUser,
    Options.Defaults.override({ log })
  )

  const UserPoolId: string | null = UserPoolArn.split('/').slice(-1)[0]
  if (UserPoolId == null) {
    throw new Error(`Invalid ${UserPoolArn}`)
  }

  const createUserResult = await adminCreateUserExecutor({
    UserPoolId,
    Username,
    ClientMetadata,
    DesiredDeliveryMediums,
    ForceAliasCreation,
    MessageAction,
    TemporaryPassword,
    UserAttributes,
    ValidationData
  })

  if (createUserResult == null || createUserResult.User == null) {
    throw new Error(`Failed to create user`)
  }

  const { User } = createUserResult

  if (IsAdmin === true) {
    const adminAddUserToGroupExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.adminAddUserToGroup,
      Options.Defaults.override({ log })
    )

    const addUserResult = await adminAddUserToGroupExecutor({
      UserPoolId,
      Username,
      GroupName: ADMIN_GROUP_NAME
    })

    if (addUserResult == null) {
      throw new Error(`Failed to create admin user`)
    }
  }

  return User
}

export default createUser
