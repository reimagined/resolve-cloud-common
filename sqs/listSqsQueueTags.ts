import SQS from 'aws-sdk/clients/sqs'
import { Log, getLog, Options, retry } from '../utils'

const listSqsQueueTags = async (
  params: {
    Region: string
    QueueUrl: string
  },
  log: Log = getLog('LIST-SQS-QUEUE-TAGS')
) => {
  const { Region, QueueUrl } = params
  const sqs = new SQS({ region: Region })

  const listSqsQueueTagsExecutor = retry(sqs, sqs.listQueueTags, Options.Defaults.override({ log }))

  try {
    log.debug(`List SQS tags with URL "${QueueUrl}"`)
    const result = await listSqsQueueTagsExecutor({
      QueueUrl
    })
    log.debug(`List SQS tags with URL "${QueueUrl}" executed succesfuly`)
    return result
  } catch (error) {
    log.debug('Failed to get list SQS queue')
    throw error
  }
}

export default listSqsQueueTags
