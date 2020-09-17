import CognitoIdentityServiceProvider, {
  UserPoolType
} from 'aws-sdk/clients/cognitoidentityserviceprovider'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      PoolName: string
      ClientName: string
      CallbackURLs: Array<string>
      LogoutURLs: Array<string>
      Domain: string
    },
    log?: Log
  ): Promise<UserPoolType>
}

const ensureUserPool: TMethod = async (
  { Region, PoolName, ClientName, CallbackURLs, LogoutURLs, Domain },
  log = getLog('ENSURE_USER_POOL')
) => {
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

    const foundPool = listUserPoolsResult.UserPools?.find(pool => pool.Name === PoolName)

    if (foundPool != null) {
      log.warn(`Pool with the same name already exists`)
      return foundPool
    }

    const createUserPoolExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.createUserPool,
      Options.Defaults.override({ log })
    )

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
      AccountRecoverySetting: {
        RecoveryMechanisms: [
          {
            Name: 'verified_phone_number',
            Priority: 1
          },
          {
            Name: 'verified_email',
            Priority: 2
          }
        ]
      }
    })

    if (createUserPoolResult == null || createUserPoolResult.UserPool == null) {
      throw new Error('Failed to create user pool')
    }

    const createUserPoolClientExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.createUserPoolClient,
      Options.Defaults.override({ log })
    )

    await createUserPoolClientExecutor({
      ClientName,
      UserPoolId: createUserPoolResult.UserPool?.Id,
      CallbackURLs,
      LogoutURLs,
      PreventUserExistenceErrors: 'LEGACY',
      ExplicitAuthFlows: ['ALLOW_CUSTOM_AUTH', 'ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'],
      GenerateSecret: true,
      AllowedOAuthFlowsUserPoolClient: true,
      AllowedOAuthFlows: ['code'],
      AllowedOAuthScopes: ['email', 'openid', 'aws.cognito.signin.user.admin', 'profile']
    })

    const createUserPoolDomainExecutor = retry(
      cognitoIdentityServiceProvider,
      cognitoIdentityServiceProvider.createUserPoolDomain,
      Options.Defaults.override({ log })
    )

    await createUserPoolDomainExecutor({
      Domain,
      UserPoolId: createUserPoolResult.UserPool?.Id
    })

    log.debug(`The user pool "${PoolName}" has been ensured`)

    return createUserPoolResult.UserPool
  } catch (error) {
    log.debug(`Failed to ensure the user pool "${PoolName}"`)

    throw error
  }
}

export default ensureUserPool
