import CognitoIdentityServiceProvider, {
  UsersListType
} from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { retry, Options, getLog, Log } from '../utils'

const listUsers = async (
  params: {
    Region: string
    UserPoolArn: string
    AttributesToGet?: Array<string>
    Filter: string
  },
  log: Log = getLog('LIST_USERS')
): Promise<UsersListType> => {
  const { Region, UserPoolArn, AttributesToGet, Filter } = params
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({ region: Region })

  const listUsersExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.listUsers,
    Options.Defaults.override({ log })
  )

  const UserPoolId: string | null = UserPoolArn.split('/').slice(-1)[0]
  if (UserPoolId == null) {
    throw new Error(`Invalid ${UserPoolArn}`)
  }

  const result: UsersListType = []

  let PaginationToken: string | undefined
  for (;;) {
    try {
      const { PaginationToken: NextPaginationToken, Users } = await listUsersExecutor({
        UserPoolId,
        AttributesToGet,
        Filter,
        Limit: 100,
        PaginationToken
      })

      if (
        NextPaginationToken == null ||
        NextPaginationToken === '' ||
        Users == null ||
        Users.length === 0
      ) {
        break
      }

      for (const user of Users) {
        result.push(user)
      }

      PaginationToken = NextPaginationToken
    } catch (error) {
      log.error(error)
      throw error
    }
  }

  return result
}

export default listUsers
