import SQS from 'aws-sdk/clients/sqs'
import { Log, getLog, Options, retry } from '../utils'

const listSqsQueue = async (
  params: {
    Region: string
  },
  log: Log = getLog('LIST-SQS-QUEUE')
): Promise<SQS.ListQueuesResult> => {
  const { Region } = params
  const sqs = new SQS({ region: Region })

  try {
    log.debug('List SQS queue')
    const listSqsQueueExecutor = retry(sqs, sqs.listQueues, Options.Defaults.override({ log }))

    const result = await listSqsQueueExecutor({})
    log.debug('List SQS queue executed succesfuly')
    return result
  } catch (error) {
    log.debug('Failed to get list queue')
    throw error
  }
}

export default listSqsQueue
