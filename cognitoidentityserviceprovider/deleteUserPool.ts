import CognitoIdentityServiceProvider, {
  GroupListType
} from 'aws-sdk/clients/cognitoidentityserviceprovider'

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
      MaxResults: 60
    })

    if (listUserPoolsResult == null) {
      throw new Error('Failed to get list user pools')
    }

    const foundPool = listUserPoolsResult.UserPools?.find((pool) => pool.Name === PoolName)

    if (foundPool == null) {
      throw new Error(`Pool with name ${PoolName} does not exist`)
    }
    const { Id: UserPoolId } = foundPool

    const listGroupsExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.listGroups,
      Options.Defaults.override({ log })
    )

    const groups: GroupListType = []

    let NextToken: string | undefined
    for (;;) {
      try {
        const { NextToken: FollowNextToken, Groups } = await listGroupsExecutor({
          UserPoolId,
          Limit: 60,
          NextToken
        })

        if (
          FollowNextToken == null ||
          FollowNextToken === '' ||
          Groups == null ||
          Groups.length === 0
        ) {
          break
        }

        for (const group of Groups) {
          groups.push(group)
        }

        NextToken = FollowNextToken
      } catch (error) {
        log.error(error)
        throw error
      }
    }

    const deleteGroupExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.deleteGroup,
      Options.Defaults.override({ log })
    )

    for (const { GroupName } of groups) {
      await deleteGroupExecutor({
        UserPoolId,
        GroupName
      })
    }

    const deleteUserPoolsExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.deleteUserPool,
      Options.Defaults.override({ log })
    )

    await deleteUserPoolsExecutor({
      UserPoolId
    })
  } catch (error) {
    log.debug(`Failed to delete the user pool "${PoolName}"`)

    throw error
  }
}

export default deleteUserPool
