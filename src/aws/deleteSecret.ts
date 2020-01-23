import SecretsManager from 'aws-sdk/clients/secretsmanager'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Name: string
    },
    log?: Log
  ): Promise<void>
}

const deleteSecret: TMethod = async ({ Region, Name }, log = getLog(`DELETE-SECRET`)) => {
  const secretsManager = new SecretsManager({ region: Region })

  const removeSecret = retry(
    secretsManager,
    secretsManager.deleteSecret,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Delete the secret "${Name}"`)
    await removeSecret({ SecretId: Name, ForceDeleteWithoutRecovery: true })
    log.debug(`The secret "${Name}" has been deleted`)
  } catch (error) {
    log.debug(`Failed to delete the secret "${Name}"`)
    throw error
  }
}

export default deleteSecret
