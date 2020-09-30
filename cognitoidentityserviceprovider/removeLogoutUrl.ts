import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { getLog, Log, Options, retry } from '../utils'

const removeLogoutUrl = async (
  params: {
    Region: string
    UserPoolArn: string
    ClientId: string
    Url: string
  },
  log: Log = getLog('REMOVE-LOGOUT-URL')
): Promise<void> => {
  const { Region, UserPoolArn, ClientId, Url } = params

  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({ region: Region })

  const UserPoolId: string | null = UserPoolArn.split('/').slice(-1)[0]
  if (UserPoolId == null || UserPoolId === '') {
    throw new Error(`Invalid UserPoolArn "${UserPoolArn}"`)
  }

  const describeUserPoolClient = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.describeUserPoolClient,
    Options.Defaults.override({ log, expectedErrors: ['ResourceNotFoundException'] })
  )

  const updateUserPoolClient = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.updateUserPoolClient,
    Options.Defaults.override({ log })
  )

  const { UserPoolClient } = await describeUserPoolClient({
    UserPoolId,
    ClientId
  })
  if (UserPoolClient == null) {
    throw new Error(`User pool client ${ClientId} not found`)
  }

  const { LogoutURLs = [] } = UserPoolClient

  if (!LogoutURLs.includes(Url)) {
    log.warn(`This URL "${Url}" was not found in client`)
    return
  }

  try {
    log.debug('Remove logout URL from client')

    await updateUserPoolClient({
      ...UserPoolClient,
      UserPoolId,
      ClientId,
      LogoutURLs: LogoutURLs.filter((logoutUrl) => logoutUrl !== Url)
    })

    log.debug(`Logout URL has been removed from the client`)
  } catch (error) {
    log.debug(`Failed to remove logout URL from the client`)

    throw error
  }
}

export default removeLogoutUrl
