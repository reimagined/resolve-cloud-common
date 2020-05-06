import SecretsManager, { GetSecretValueResponse } from 'aws-sdk/clients/secretsmanager'
import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Name: string
    },
    log?: Log
  ): Promise<GetSecretValueResponse>
}

const getSecret: TMethod = async ({ Region, Name }, log = getLog(`GET-SECRET`)) => {
  const secretsManager = new SecretsManager({ region: Region })

  const result = retry(
    secretsManager,
    secretsManager.getSecretValue,
    Options.Defaults.override({ log })
  )

  try {
    log.debug('Get a secret')
    const secret = await result({ SecretId: Name })
    log.debug('The secret has been got')

    return secret
  } catch (error) {
    log.debug('Failed to get a secret')
    throw error
  }
}

export default getSecret
