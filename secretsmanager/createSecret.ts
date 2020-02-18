import SecretsManager from 'aws-sdk/clients/secretsmanager'
import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Name: string
      SecretString: string
      Description?: string
      Tags?: { [key: string]: string }
    },
    log?: Log
  ): Promise<string>
}

const createSecret: TMethod = async (
  { Region, Description, Name, SecretString, Tags: { ...RawTags } = {} },
  log = getLog(`CREATE-SECRET`)
) => {
  delete RawTags.Owner

  const Tags = [
    ...Array.from(Object.entries(RawTags)).map(([Key, Value]) => ({
      Key,
      Value
    })),
    {
      Key: 'Owner',
      Value: 'reimagined'
    }
  ]

  const secretsManager = new SecretsManager({ region: Region })

  const addSecret = retry(
    secretsManager,
    secretsManager.createSecret,
    Options.Defaults.override({ log })
  )

  try {
    log.debug('Create a secret')
    const { ARN } = await addSecret({ Description, Name, SecretString, Tags })
    log.debug('The secret has been created')

    if (ARN == null) {
      throw new Error('Unknown ARN')
    }

    return ARN
  } catch (error) {
    log.debug('Failed to create a secret')
    throw error
  }
}

export default createSecret
