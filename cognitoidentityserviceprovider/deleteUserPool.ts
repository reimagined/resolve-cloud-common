import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      PoolName: string
    },
    log?: Log
  ): Promise<void>
}

const deleteUserPool: TMethod = async ({ Region, PoolName }, log = getLog('DELETE_USER_POOL')) => {
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({ region: Region })

  try {
    const listUserPoolsExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.listUserPools,
      Options.Defaults.override({ log })
    )

    const listUserPoolsResult = await listUserPoolsExecutor({
      MaxResults: 100
    })

    if (listUserPoolsResult == null) {
      throw new Error('Failed to get list user pools')
    }

    const foundPool = listUserPoolsResult.UserPools?.find((pool) => pool.Name === PoolName)

    if (foundPool == null) {
      throw new Error(`Pool with name ${PoolName} does not exist`)
    }

    const deleteUserPoolsExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.deleteUserPool,
      Options.Defaults.override({ log })
    )

    await deleteUserPoolsExecutor({
      UserPoolId: foundPool.Id
    })
  } catch (error) {
    log.debug(`Failed to delete the user pool "${PoolName}"`)

    throw error
  }
}

export default deleteUserPool
