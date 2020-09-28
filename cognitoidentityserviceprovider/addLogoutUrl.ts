import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { getLog, Log, Options, retry } from '../utils'

const addLogoutUrl = async (
  params: {
    Region: string
    UserPoolArn: string
    ClientId: string
    Url: string
  },
  log: Log = getLog('ADD_LOGOUT_URL')
): Promise<void> => {
  const { Region, UserPoolArn, ClientId, Url } = params

  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({ region: Region })

  const UserPoolId: string | null = UserPoolArn.split('/').slice(-1)[0]
  if (UserPoolId == null) {
    throw new Error(`Invalid UserPoolArn "${UserPoolArn}"`)
  }

  const describeUserPoolClient = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.describeUserPoolClient,
    Options.Defaults.override({ log })
  )

  const { UserPoolClient } = await describeUserPoolClient({
    UserPoolId
  })
  if (UserPoolClient == null) {
    throw new Error(`User pool client ${ClientId} not found`)
  }

  const { LogoutURLs = [] } = UserPoolClient

  const updateUserPoolClient = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.updateUserPoolClient,
    Options.Defaults.override({ log })
  )

  if (LogoutURLs.includes(Url)) {
    log.warn(`This URL "${Url}" already exists`)
    return
  } else {
    LogoutURLs.push(Url)
  }

  try {
    log.debug('Add logout URL to client')

    await updateUserPoolClient({
      ...UserPoolClient,
      UserPoolId,
      ClientId,
      LogoutURLs
    })

    log.debug(`Logout URL has been added to the client`)
  } catch (error) {
    log.debug(`Failed to add logout URL to the client`)

    throw error
  }
}

export default addLogoutUrl
