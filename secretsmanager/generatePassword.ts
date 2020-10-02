import SecretsManager from 'aws-sdk/clients/secretsmanager'

import { retry, Options, getLog, Log } from '../utils'

const generatePassword = async (
  params: {
    Region: string
    IncludeSpace?: boolean
    PasswordLength?: number
    RequireEachIncludedType?: boolean
    ExcludePunctuation?: boolean
    ExcludeCharacters?: string
    ExcludeLowercase?: boolean
    ExcludeNumbers?: boolean
    ExcludeUppercase?: boolean
  },
  log: Log = getLog('GENERATE-PASSWORD')
): Promise<string> => {
  const {
    Region,
    IncludeSpace,
    PasswordLength,
    RequireEachIncludedType,
    ExcludePunctuation,
    ExcludeCharacters,
    ExcludeLowercase,
    ExcludeNumbers,
    ExcludeUppercase
  } = params

  const secretsManager = new SecretsManager({ region: Region })

  try {
    log.debug('Generate a password')

    const getRandomPassword = retry(
      secretsManager,
      secretsManager.getRandomPassword,
      Options.Defaults.override({ log })
    )
    const { RandomPassword } = await getRandomPassword({
      IncludeSpace,
      PasswordLength,
      RequireEachIncludedType,
      ExcludePunctuation,
      ExcludeCharacters,
      ExcludeLowercase,
      ExcludeNumbers,
      ExcludeUppercase
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

export default generatePassword
