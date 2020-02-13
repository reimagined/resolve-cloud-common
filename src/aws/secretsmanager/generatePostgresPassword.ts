import SecretsManager from 'aws-sdk/clients/secretsmanager'

import { retry, Options, getLog, Log } from '../../utils'

interface TMethod {
  (
    params: {
      Region: string
    },
    log?: Log
  ): Promise<string>
}

const generatePostgresPassword: TMethod = async (
  { Region },
  log = getLog('GENERATE-POSTGRESQL-PASSWORD')
) => {
  const secretsManager = new SecretsManager({ region: Region })

  try {
    log.debug('Generate a password')

    const getRandomPassword = retry(
      secretsManager,
      secretsManager.getRandomPassword,
      Options.Defaults.override({ log })
    )
    const { RandomPassword } = await getRandomPassword({
      ExcludePunctuation: true,
      IncludeSpace: false,
      PasswordLength: 30,
      RequireEachIncludedType: true
    })

    log.debug('The password has been generated')

    if (RandomPassword == null) {
      throw new Error('Unknown password')
    }

    return RandomPassword
  } catch (error) {
    log.debug('Failed to generate a password')
    throw error
  }
}

export default generatePostgresPassword
