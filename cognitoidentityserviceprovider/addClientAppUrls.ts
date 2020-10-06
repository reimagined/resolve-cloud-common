import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { getLog, Log, Options, retry } from '../utils'

const addClientAppUrls = async (
  params: {
    Region: string
    UserPoolArn: string
    ClientId: string
    CallbackUrl?: string
    LogoutUrl?: string
  },
  log: Log = getLog('ADD-CLIENT-APP-URLS')
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
    ClientId,
    UserPoolId
  })
  if (UserPoolClient == null) {
    throw new Error(`User pool client ${ClientId} not found`)
  }

  const { CallbackURLs = [], LogoutURLs = [] } = UserPoolClient

  if (CallbackUrl != null) {
    if (CallbackURLs.includes(CallbackUrl)) {
      log.warn(`This callback URL "${CallbackUrl}" already exists`)
    } else {
      CallbackURLs.push(CallbackUrl)
    }
  }

  if (LogoutUrl != null) {
    if (LogoutURLs.includes(LogoutUrl)) {
      log.warn(`This logout URL "${LogoutUrl}" already exists`)
    } else {
      LogoutURLs.push(LogoutUrl)
    }
  }

  try {
    log.debug('Add client app URLs')

    delete UserPoolClient.LastModifiedDate
    delete UserPoolClient.CreationDate

    await updateUserPoolClient({
      ...UserPoolClient,
      UserPoolId,
      ClientId,
      CallbackURLs,
      LogoutURLs
    })

    log.debug(`Client app URLs has been added.`)
  } catch (error) {
    log.debug(`Failed to add client app URLs.`)

    throw error
  }
}

export default addClientAppUrls
