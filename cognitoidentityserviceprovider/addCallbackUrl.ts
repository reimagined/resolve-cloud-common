import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { getLog, Log, Options, retry } from '../utils'

const addCallbackUrl = async (
  params: {
    Region: string
    UserPoolArn: string
    ClientId: string
    Url: string
  },
  log: Log = getLog('ADD-CALLBACK-URL')
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
    ClientId,
    UserPoolId
  })
  if (UserPoolClient == null) {
    throw new Error(`User pool client ${ClientId} not found`)
  }

  const { CallbackURLs = [] } = UserPoolClient

  if (CallbackURLs.includes(Url)) {
    log.warn(`This URL "${Url}" already exists`)
    return
  } else {
    CallbackURLs.push(Url)
  }

  try {
    log.debug('Add callback URL to client')

    await updateUserPoolClient({
      ...UserPoolClient,
      UserPoolId,
      ClientId,
      CallbackURLs
    })

    log.debug(`Callback URL has been added to the client`)
  } catch (error) {
    log.debug(`Failed to add callback URL to the client`)

    throw error
  }
}

export default addCallbackUrl
