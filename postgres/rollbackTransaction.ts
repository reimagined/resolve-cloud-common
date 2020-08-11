import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { getLog, Log, Options, retry } from '../utils'
import { highloadExecute } from './highloadExecute'

async function rollbackTransaction(
  params: {
    Region: string
    ResourceArn: string
    SecretArn: string
    TransactionId: string
  },
  log: Log = getLog('ROLLBACK_TRANSACTION')
): Promise<string> {
  const { Region, ResourceArn, SecretArn, TransactionId } = params

  const rdsDataService = new RDSDataService({
    region: Region,
  })

  try {
    const execute = retry(
      rdsDataService,
      highloadExecute(rdsDataService.rollbackTransaction),
      Options.Defaults.override({ log, maxAttempts: 1 })
    )
    const result = await execute({
      resourceArn: ResourceArn,
      secretArn: SecretArn,
      transactionId: TransactionId,
    })

    const { transactionStatus } = result

    if (transactionStatus == null) {
      throw new Error('Transaction not rollback')
    }

    log.verbose('Transaction have been rollback')

    return transactionStatus
  } catch (error) {
    log.debug('Failed to rollback transaction')
    throw error
  }
}

export default rollbackTransaction
