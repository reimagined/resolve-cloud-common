import { getLog, Log } from '../utils'
import listUsers from './listUsers'

type UserWithAdminFlagType = {
  Username: string
  Status: boolean
  UserStatus: string
  IsAdmin: boolean
  Sub?: string
}

const getUser = async (
  params: {
    Region: string
    UserPoolArn: string
    UserName: string
  },
  log: Log = getLog('GET-USER')
): Promise<UserWithAdminFlagType> => {
  const { Region, UserPoolArn, UserName } = params
  const users = await listUsers({
    Region,
    UserPoolArn,
    Filter: `username = ${JSON.stringify(UserName)}`
  })

  if (users == null || users.length === 0) {
    const errorMessage = `User ${UserName} is not found`
    log.error(errorMessage)
    throw new Error(errorMessage)
  }
  if (users.length > 1) {
    const errorMessage = `To many users: ${UserName}`
    log.error(errorMessage)
    throw new Error(errorMessage)
  }

  return users[0]
}

export default getUser
