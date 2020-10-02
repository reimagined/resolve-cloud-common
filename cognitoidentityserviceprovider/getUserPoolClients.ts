import CognitoIdentityServiceProvider, {
  UserPoolClientListType
} from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { getLog, Log, Options, retry } from '../utils'

const getUserPoolClients = async (
  params: {
    Region: string
    UserPoolArn: string
  },
  log: Log = getLog('GET-USER-POOL-CLIENTS')
): Promise<UserPoolClientListType> => {
  const { Region, UserPoolArn } = params

  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({ region: Region })

  const UserPoolId: string | null = UserPoolArn.split('/').slice(-1)[0]
  if (UserPoolId == null) {
    throw new Error(`Invalid UserPoolArn "${UserPoolArn}"`)
  }

  const listUserPoolClients = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.listUserPoolClients,
    Options.Defaults.override({ log })
  )

  const clients: UserPoolClientListType = []

  let NextToken: string | undefined
  for (;;) {
    try {
      const { NextToken: FollowNextToken, UserPoolClients } = await listUserPoolClients({
        UserPoolId,
        MaxResults: 60,
        NextToken
      })

      if (UserPoolClients != null) {
        for (const client of UserPoolClients) {
          clients.push(client)
        }
      }

      if (
        FollowNextToken == null ||
        FollowNextToken === '' ||
        UserPoolClients == null ||
        UserPoolClients.length === 0
      ) {
        break
      }

      NextToken = FollowNextToken
    } catch (error) {
      log.error(error)
      throw error
    }
  }

  return clients
}

export default getUserPoolClients
