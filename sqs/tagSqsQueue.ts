import SQS from 'aws-sdk/clients/sqs'
import { Log, getLog, Options, retry } from '../utils'

const tagSqsQueue = async (
  params: {
    Region: string
    QueueUrl: string
    Tags: Record<string, string>
  },
  log: Log = getLog('TAGS-SQS-QUEUE')
): Promise<void> => {
  const { Region, QueueUrl, Tags } = params
  const sqs = new SQS({ region: Region })
  try {
    log.debug(`Set tags on SQS`)
    const tagSqsQueueExecutor = retry(sqs, sqs.tagQueue, Options.Defaults.override({ log }))

    await tagSqsQueueExecutor({
      QueueUrl,
      Tags
    })
  } catch (error) {
    log.debug('Failed to set SQS tags')
    throw error
  }
  log.debug('Set tags sucsesfuly complete')
}

export default tagSqsQueue
