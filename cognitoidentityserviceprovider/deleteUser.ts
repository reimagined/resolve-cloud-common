import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { retry, Options, getLog, Log } from '../utils'
import { ADMIN_GROUP_NAME } from './constants'

const deleteUser = async (
  params: {
    Region: string
    UserPoolArn: string
    Username: string
  },
  log: Log = getLog('DELETE_USER')
): Promise<void> => {
  const { Region, UserPoolArn, Username } = params
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({ region: Region })

  const adminRemoveUserToGroupExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.adminRemoveUserFromGroup,
    Options.Defaults.override({ log })
  )

  const UserPoolId: string | null = UserPoolArn.split('/').slice(-1)[0]
  if (UserPoolId == null || UserPoolId === '') {
    throw new Error(`Invalid ${UserPoolArn}`)
  }

  try {
    await adminRemoveUserToGroupExecutor({
      UserPoolId,
      Username,
      GroupName: ADMIN_GROUP_NAME
    })
  } catch (error) {
    log.warn(error)
  }

  const adminDeleteUserExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.adminDeleteUser,
    Options.Defaults.override({ log })
  )

  await adminDeleteUserExecutor({
    UserPoolId,
    Username
  })
}

export default deleteUser
