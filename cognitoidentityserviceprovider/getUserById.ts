import { getLog, Log } from '../utils'
import listUsers from './listUsers'

type UserWithAdminFlagType = {
  UserId: string
  Email: string
  Status: boolean
  UserStatus: string
  IsAdmin: boolean
}

const getUserById = async (
  params: {
    Region: string
    UserPoolArn: string
    UserId: string
  },
  log: Log = getLog('GET-USER-BY-ID')
): Promise<UserWithAdminFlagType> => {
  const { Region, UserPoolArn, UserId } = params

  const users = await listUsers({
    Region,
    UserPoolArn,
    Filter: `sub = ${JSON.stringify(UserId)}`
  })

  if (users == null || users.length === 0) {
    const errorMessage = `User ${UserId} is not found`
    log.error(errorMessage)
    throw new Error(errorMessage)
  }
  if (users.length > 1) {
    const errorMessage = `To many users: ${UserId}`
    log.error(errorMessage)
    throw new Error(errorMessage)
  }

  return users[0]
}

export default getUserById
