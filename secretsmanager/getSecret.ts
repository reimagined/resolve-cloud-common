import SecretsManager, { GetSecretValueResponse } from 'aws-sdk/clients/secretsmanager'
import { retry, Options, getLog, Log } from '../utils'

const getSecret = async (
  params: {
    Region: string
    Name: string
  },
  log: Log = getLog(`GET-SECRET`)
): Promise<GetSecretValueResponse> => {
  const { Region, Name } = params

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
