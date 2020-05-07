import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { getLog, Log, Options, retry } from '../utils'
import { highloadExecute } from './highloadExecute'

async function beginTransaction(
  params: {
    Region: string
    ResourceArn: string
    SecretArn: string
    Database?: string
    Schema?: string
  },
  log: Log = getLog('BEGIN_TRANSACTION')
): Promise<string> {
  const { Region, ResourceArn, SecretArn, Database, Schema } = params

  const rdsDataService = new RDSDataService({
    region: Region
  })

  try {
    const execute = retry(
      rdsDataService,
      highloadExecute(rdsDataService.beginTransaction),
      Options.Defaults.override({ log, maxAttempts: 1 })
    )
    const result = await execute({
      resourceArn: ResourceArn,
      secretArn: SecretArn,
      database: Database,
      schema: Schema
    })

    const { transactionId } = result

    if (transactionId == null) {
      throw new Error('Transaction not created')
    }
    log.verbose('Transaction have been created')

    return transactionId
  } catch (error) {
    log.debug('Failed to begin transaction')
    throw error
  }
}

export default beginTransaction
