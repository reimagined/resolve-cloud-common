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
  log: Log = getLog('GET_USER')
): Promise<UserWithAdminFlagType> => {
  const { Region, UserPoolArn, UserName } = params
  const users = await listUsers({
    Region,
    UserPoolArn,
    Filter: `username = ${JSON.stringify(UserName)}`
  })

  if (users == null || users.length !== 1) {
    const errorMessage = `Either user ${UserName} does not found nor there is multiple choices`
    log.error(errorMessage)
    throw new Error(errorMessage)
  }

  return users[0]
}

export default getUser
