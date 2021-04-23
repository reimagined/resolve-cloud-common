import CognitoIdentityServiceProvider, {
  UserPoolType
} from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { ADMIN_GROUP_NAME, ADMIN_GROUP_DESCRIPTION } from './constants'
import { retry, Options, getLog, Log } from '../utils'

const ensureUserPool = async (
  params: {
    Region: string
    PoolName: string
    ClientName: string
    CallbackURLs: Array<string>
    LogoutURLs: Array<string>
    Domain: string
    Tags?: Record<string, string>
  },
  log: Log = getLog('ENSURE_USER_POOL')
): Promise<UserPoolType> => {
  const { Region, PoolName, ClientName, CallbackURLs, LogoutURLs, Domain, Tags = {} } = params
  Tags.Owner = 'reimagined'

  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({ region: Region })

  try {
    const listUserPoolsExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.listUserPools,
      Options.Defaults.override({ log })
    )

    const createUserPoolExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.createUserPool,
      Options.Defaults.override({ log })
    )

    const createUserPoolClientExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.createUserPoolClient,
      Options.Defaults.override({ log })
    )

    const createUserPoolDomainExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.createUserPoolDomain,
      Options.Defaults.override({ log })
    )

    const createGroupExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.createGroup,
      Options.Defaults.override({ log })
    )

    const listUserPoolsResult = await listUserPoolsExecutor({
      MaxResults: 60
    })

    if (listUserPoolsResult == null) {
      throw new Error('Failed to get list user pools')
    }

    const foundPool = listUserPoolsResult.UserPools?.find((pool) => pool.Name === PoolName)

    if (foundPool != null) {
      log.warn(`Pool with the same name already exists`)
      return foundPool
    }

    const createUserPoolResult = await createUserPoolExecutor({
      PoolName,
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireNumbers: true,
          RequireLowercase: true,
          RequireUppercase: true,
          TemporaryPasswordValidityDays: 7
        }
      },
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: false
      },
      MfaConfiguration: 'OFF',
      UserPoolTags: Tags
    })

    if (createUserPoolResult == null || createUserPoolResult.UserPool == null) {
      throw new Error('Failed to create user pool')
    }

    const UserPoolId = createUserPoolResult.UserPool?.Id

    if (UserPoolId == null || UserPoolId === '') {
      throw new Error(`Pool with name ${PoolName} does not exist`)
    }

    await createUserPoolClientExecutor({
      ClientName,
      UserPoolId,
      CallbackURLs,
      LogoutURLs,
      PreventUserExistenceErrors: 'LEGACY',
      ExplicitAuthFlows: ['ALLOW_CUSTOM_AUTH', 'ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'],
      GenerateSecret: false,
      AllowedOAuthFlowsUserPoolClient: true,
      AllowedOAuthFlows: ['code'],
      AllowedOAuthScopes: ['email', 'openid', 'aws.cognito.signin.user.admin', 'profile'],
      SupportedIdentityProviders: ['COGNITO'],
      TokenValidityUnits: {
        RefreshToken: 'days',
        AccessToken: 'minutes',
        IdToken: 'minutes'
      },
      RefreshTokenValidity: 3650,
      AccessTokenValidity: 60,
      IdTokenValidity: 60
    })

    await createUserPoolDomainExecutor({
      Domain,
      UserPoolId
    })

    log.debug(`The user pool "${PoolName}" has been ensured`)

    const { UserPool } = createUserPoolResult
    if (UserPool == null) {
      throw new Error(`User pool is null`)
    }

    const groupResult = await createGroupExecutor({
      UserPoolId,
      GroupName: ADMIN_GROUP_NAME,
      Description: ADMIN_GROUP_DESCRIPTION
    })

    if (groupResult == null || groupResult.Group == null) {
      throw new Error(`Failed to create group`)
    }

    return UserPool
  } catch (error) {
    log.debug(`Failed to ensure the user pool "${PoolName}"`)

    throw error
  }
}

export default ensureUserPool
