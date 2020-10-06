import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { retry, Options, getLog, Log } from '../utils'
import { ADMIN_GROUP_NAME } from './constants'
import getUserById from './getUserById'

const deleteUserById = async (
  params: {
    Region: string
    UserPoolArn: string
    UserId: string
    IfExists?: boolean
  },
  log: Log = getLog('DELETE-USER-BY-ID')
): Promise<void> => {
  const { Region, UserPoolArn, UserId, IfExists } = params
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({ region: Region })

  const adminRemoveUserToGroupExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.adminRemoveUserFromGroup,
    Options.Defaults.override({ log, expectedErrors: ['UserNotFoundException'] })
  )

  const adminDeleteUserExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.adminDeleteUser,
    Options.Defaults.override({ log, expectedErrors: ['UserNotFoundException'] })
  )

  const UserPoolId: string | null = UserPoolArn.split('/').slice(-1)[0]
  if (UserPoolId == null || UserPoolId === '') {
    throw new Error(`Invalid ${UserPoolArn}`)
  }
  try {
    const { Email } = await getUserById({
      Region,
      UserId,
      UserPoolArn
    })

    try {
      await adminRemoveUserToGroupExecutor({
        UserPoolId,
        Username: Email,
        GroupName: ADMIN_GROUP_NAME
      })
    } catch (error) {
      log.warn(error)
    }

    await adminDeleteUserExecutor({
      UserPoolId,
      Username: UserId
    })
  } catch (error) {
    if (!(IfExists && error != null && error.code === 'UserNotFoundException')) {
      throw error
    }
  }
}

export default deleteUserById
