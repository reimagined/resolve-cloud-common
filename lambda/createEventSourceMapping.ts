import Lambda from 'aws-sdk/clients/lambda'
import SQS from 'aws-sdk/clients/sqs'
import STS from 'aws-sdk/clients/sts'

import { Log, Options, retry, getLog } from '../utils'

const createEventSourceMapping = async (
  params: {
    FunctionName: string
    QueueName: string
    BatchSize?: number
    MaximumBatchingWindowInSeconds?: number
    Region: string
  },
  log: Log = getLog('CREATE-EVENT-SOURCE-MAPPING')
): Promise<void> => {
  const {
    FunctionName,
    QueueName,
    BatchSize = 10,
    MaximumBatchingWindowInSeconds = 2,
    Region
  } = params

  const lambda = new Lambda({ region: Region })
  const sts = new STS({ region: Region })
  const sqs = new SQS({ region: Region })

  try {
    log.debug('Create an event source mapping')
    const createEventSourceMappingExecutor = retry(
      lambda,
      lambda.createEventSourceMapping,
      Options.Defaults.override({ log })
    )
    const getQueueUrlExecutor = retry(sqs, sqs.getQueueUrl, Options.Defaults.override({ log }))
    const { Account } = await sts.getCallerIdentity().promise()
    const { QueueUrl } = await getQueueUrlExecutor({
      QueueName,
      QueueOwnerAWSAccountId: Account
    })
    const QueueArn = `arn:aws:sqs:${Region}:${Account}:${QueueName}`

    if (Account == null || Account === '' || QueueUrl == null || QueueUrl === '') {
      throw new Error('Failed to create event source mapping')
    }

    await createEventSourceMappingExecutor({
      FunctionName,
      EventSourceArn: QueueArn,
      BatchSize,
      MaximumBatchingWindowInSeconds
    })
  } catch (error) {
    log.debug('Failed to create event source mapping')
    throw error
  }
  log.debug(
    `Event source mapping between lambda "${FunctionName}" and queue "${QueueName}" has been created`
  )
}

export default createEventSourceMapping
