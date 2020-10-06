import { getLog, Log } from '../utils'
import listUsers from './listUsers'

type UserWithAdminFlagType = {
  Username: string
  UserId: string
  Status: boolean
  UserStatus: string
  IsAdmin: boolean
}

const getUser = async (
  params: {
    Region: string
    UserPoolArn: string
    Username: string
  },
  log: Log = getLog('GET-USER')
): Promise<UserWithAdminFlagType> => {
  const { Region, UserPoolArn, Username } = params

  const users = await listUsers({
    Region,
    UserPoolArn,
    Filter: `email = ${JSON.stringify(Username)}`
  })

  if (users == null || users.length === 0) {
    const errorMessage = `User ${Username} is not found`
    log.error(errorMessage)
    throw new Error(errorMessage)
  }
  if (users.length > 1) {
    const errorMessage = `To many users: ${Username}`
    log.error(errorMessage)
    throw new Error(errorMessage)
  }

  return users[0]
}

export default getUser
