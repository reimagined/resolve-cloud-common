import CognitoIdentityServiceProvider, {
  UsersListType
} from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { retry, Options, getLog, Log, maybeThrowErrors } from '../utils'
import { ADMIN_GROUP_NAME, SUB_ATTRIBUTE, EMAIL_ATTRIBUTE } from './constants'

type UserListWithAdminFlagType = Array<{
  UserId: string
  Email: string
  Status: boolean
  UserStatus: string
  IsAdmin: boolean
}>

const listUsers = async (
  params: {
    Region: string
    UserPoolArn: string
    Filter?: string
  },
  log: Log = getLog('LIST-USERS')
): Promise<UserListWithAdminFlagType> => {
  const { Region, UserPoolArn, Filter } = params
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({ region: Region })

  const listUsersExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.listUsers,
    Options.Defaults.override({ log })
  )

  const adminListGroupsForUserExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.adminListGroupsForUser,
    Options.Defaults.override({ log })
  )

  const UserPoolId: string | null = UserPoolArn.split('/').slice(-1)[0]
  if (UserPoolId == null || UserPoolId === '') {
    throw new Error(`Invalid ${UserPoolArn}`)
  }

  const users: UsersListType = []

  let PaginationToken: string | undefined
  for (;;) {
    try {
      const { PaginationToken: NextPaginationToken, Users } = await listUsersExecutor({
        UserPoolId,
        Limit: 60,
        AttributesToGet: [EMAIL_ATTRIBUTE, SUB_ATTRIBUTE],
        Filter,
        PaginationToken
      })

      if (Users != null) {
        for (const user of Users) {
          users.push(user)
        }
      }

      if (
        NextPaginationToken == null ||
        NextPaginationToken === '' ||
        Users == null ||
        Users.length === 0
      ) {
        break
      }

      PaginationToken = NextPaginationToken
    } catch (error) {
      log.error(error)
      throw error
    }
  }

  const result: UserListWithAdminFlagType = []
  const promises: Array<Promise<any>> = []
  const errors: Array<Error> = []

  for (const { Username, Enabled: Status, UserStatus, Attributes } of users) {
    if (Username != null && Status != null && UserStatus != null && Attributes != null) {
      promises.push(
        (async (): Promise<void> => {
          try {
            const { Groups } = await adminListGroupsForUserExecutor({
              UserPoolId,
              Username,
              Limit: 1
            })
            const IsAdmin = (Groups?.length ?? 0) > 0 && Groups?.[0]?.GroupName === ADMIN_GROUP_NAME
            const Sub = Attributes?.find(({ Name }) => Name === SUB_ATTRIBUTE)?.Value
            const Email = Attributes?.find(({ Name }) => Name === EMAIL_ATTRIBUTE)?.Value

            if (Email != null && Sub != null) {
              result.push({ Email, Status, UserStatus, IsAdmin, UserId: Sub })
            }
          } catch (err) {
            errors.push(err)
          }
        })()
      )
    } else {
      errors.push(
        new Error(
          `Either ${JSON.stringify({ Username, Enabled: Status, UserStatus, Attributes })} is null`
        )
      )
    }
  }

  await Promise.all(promises)

  maybeThrowErrors(errors)

  return result
}

export default listUsers
