import CognitoIdentityServiceProvider, {
  GroupListType
} from 'aws-sdk/clients/cognitoidentityserviceprovider'
import Resourcegroupstaggingapi from 'aws-sdk/clients/resourcegroupstaggingapi'
import STS from 'aws-sdk/clients/sts'

import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteUserPool = async (
  params: {
    Region: string
    PoolName: string
    IfExists: boolean
  },
  log: Log = getLog('DELETE_USER_POOL')
): Promise<void> => {
  const { Region, PoolName, IfExists } = params

  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({ region: Region })
  const taggingAPI = new Resourcegroupstaggingapi({ region: Region })
  const sts = new STS({ region: Region })

  const listUserPoolsExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.listUserPools,
    Options.Defaults.override({ log })
  )
  const listGroupsExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.listGroups,
    Options.Defaults.override({ log })
  )

  const listTagsForResourceExecutor = retry(
    cognitoIdentityServiceProvider,
    cognitoIdentityServiceProvider.listTagsForResource,
    Options.Defaults.override({ log })
  )
  const getCallerIdentityExecutor = retry<any, any>(
    sts,
    sts.getCallerIdentity,
    Options.Defaults.override({ log })
  )

  const untagResourcesExecutor = retry(
    taggingAPI,
    taggingAPI.untagResources,
    Options.Defaults.override({ log })
  )

  try {
    const { Account: AccountId } = await getCallerIdentityExecutor(undefined)
    if (AccountId == null) {
      throw new Error(`Cannot determine account id`)
    }

    let NextToken: string | undefined
    let UserPoolId: string | undefined
    searchLoop: for (;;) {
      const { NextToken: FollowNextToken, UserPools } = await listUserPoolsExecutor({
        MaxResults: 60,
        NextToken
      })

      if (
        FollowNextToken == null ||
        FollowNextToken === '' ||
        UserPools == null ||
        UserPools.length === 0
      ) {
        break searchLoop
      }

      for (const { Name, Id } of UserPools) {
        if (Name === PoolName) {
          UserPoolId = Id

          break searchLoop
        }
      }

      NextToken = FollowNextToken
    }

    if (UserPoolId == null) {
      throw new Error(`Pool with name ${PoolName} does not exist`)
    }

    try {
      const UserPoolArn = `arn:aws:cognito-idp:${Region}:${AccountId}:userpool/${UserPoolId}`
      const { Tags } = await listTagsForResourceExecutor({ ResourceArn: UserPoolArn })
      if (Tags == null) {
        throw new Error(`Tags for Cognito identity pool is null`)
      }

      await untagResourcesExecutor({
        ResourceARNList: [UserPoolArn],
        TagKeys: Object.keys(Tags)
      })
    } catch (error) {
      log.warn(error)
    }

    const groups: GroupListType = []

    for (;;) {
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
    if (IfExists) {
      log.debug(`Skip delete the user pool "${PoolName}"`)
      ignoreNotFoundException(error)
    } else {
      log.debug(`Failed to delete the user pool "${PoolName}"`)
      throw error
    }
  }
}

export default deleteUserPool
