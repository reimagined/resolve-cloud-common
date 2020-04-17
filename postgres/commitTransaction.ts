import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { getLog, Log, Options, retry } from '../utils'

async function commitTransaction(
  params: {
    Region: string
    ResourceArn: string
    SecretArn: string
    TransactionId: string
  },
  log: Log = getLog('COMMIT_TRANSACTION')
): Promise<string> {
  const { Region, ResourceArn, SecretArn, TransactionId } = params

  const rdsDataService = new RDSDataService({
    region: Region
  })

  try {
    const execute = retry(
      rdsDataService,
      rdsDataService.commitTransaction,
      Options.Defaults.override({ log, maxAttempts: 1 })
    )
    const result = await execute({
      resourceArn: ResourceArn,
      secretArn: SecretArn,
      transactionId: TransactionId
    })

    const { transactionStatus } = result

    if (transactionStatus == null) {
      throw new Error('Transaction not committed')
    }

    log.verbose('Transaction have been committed')

    return transactionStatus
  } catch (error) {
    log.debug('Failed to commit transaction')
    throw error
  }
}

export default commitTransaction
