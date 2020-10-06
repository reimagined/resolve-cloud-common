import { getLog, Log } from '../utils'
import listUsers from './listUsers'

type UserWithAdminFlagType = {
  UserId: string
  Email: string
  Status: boolean
  UserStatus: string
  IsAdmin: boolean
}

const getUserByEmail = async (
  params: {
    Region: string
    UserPoolArn: string
    Email: string
  },
  log: Log = getLog('GET-USER-BY-EMAIL')
): Promise<UserWithAdminFlagType> => {
  const { Region, UserPoolArn, Email } = params

  const users = await listUsers({
    Region,
    UserPoolArn,
    Filter: `email = ${JSON.stringify(Email)}`
  })

  if (users == null || users.length === 0) {
    const errorMessage = `User ${Email} is not found`
    log.error(errorMessage)
    throw new Error(errorMessage)
  }
  if (users.length > 1) {
    const errorMessage = `To many users: ${Email}`
    log.error(errorMessage)
    throw new Error(errorMessage)
  }

  return users[0]
}

export default getUserByEmail
