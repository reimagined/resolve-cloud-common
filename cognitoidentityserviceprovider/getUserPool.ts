import Cognitoidentityserviceprovider, {
  UserPoolType
} from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { retry, Options, getLog, Log } from '../utils'

const getUserPool = async (
  params: {
    Region: string
    UserPoolArn: string
  },
  log: Log = getLog('GET-USER-POOL')
): Promise<UserPoolType> => {
  const { Region, UserPoolArn } = params
  const cognito = new Cognitoidentityserviceprovider({ region: Region })

  const UserPoolId: string | null = UserPoolArn.split('/').slice(-1)[0]
  if (UserPoolId == null) {
    throw new Error(`Invalid ${UserPoolArn}`)
  }

  const describeUserPool = retry(
    cognito,
    cognito.describeUserPool,
    Options.Defaults.override({ log })
  )

  const { UserPool } = await describeUserPool({
    UserPoolId
  })
  if (UserPool == null) {
    const error: Error & { code?: string } = new Error(`User pool ${UserPoolArn} not found`)
    error.code = 'ResourceNotFoundException'
    throw error
  }

  return UserPool
}

export default getUserPool
