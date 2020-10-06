import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { getLog, Log, Options, retry } from '../utils'

const removeClientAppUrls = async (
  params: {
    Region: string
    UserPoolArn: string
    ClientId: string
    CallbackUrl?: string
    LogoutUrl?: string
  },
  log: Log = getLog('REMOVE-CLIENT-APP-URL')
): Promise<void> => {
  const { Region, UserPoolArn, ClientId, CallbackUrl, LogoutUrl } = params

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

  let { CallbackURLs = [], LogoutURLs = [] } = UserPoolClient

  if (CallbackUrl != null) {
    if (!CallbackURLs.includes(CallbackUrl)) {
      log.warn(`This callback URL "${CallbackUrl}" was not found in client`)
    } else {
      CallbackURLs = CallbackURLs.filter((callbackUrl) => callbackUrl !== CallbackUrl)
    }
  }

  if (LogoutUrl != null) {
    if (!LogoutURLs.includes(LogoutUrl)) {
      log.warn(`This logout URL "${LogoutUrl}" was not found in client`)
    } else {
      LogoutURLs = LogoutURLs.filter((logoutUrl) => logoutUrl !== LogoutUrl)
    }
  }

  try {
    log.debug('Remove client app URLs')

    delete UserPoolClient.LastModifiedDate
    delete UserPoolClient.CreationDate

    await updateUserPoolClient({
      ...UserPoolClient,
      UserPoolId,
      ClientId,
      CallbackURLs,
      LogoutURLs
    })

    log.debug(`Client app URLs has been removed`)
  } catch (error) {
    log.debug(`Failed to remove client app URLs`)

    throw error
  }
}

export default removeClientAppUrls
