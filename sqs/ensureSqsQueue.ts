import SQS from 'aws-sdk/clients/sqs'
import { Log, getLog, Options, retry } from '../utils'

const ensureSqsQueue = async (
  params: {
    Region: string
    QueueName: string
    VisibilityTimeout?: number
    MaximumMessageSize?: number
    MessageRetentionPeriod?: number
    DelaySeconds?: number
    ReceiveMessageWaitTimeSeconds?: number
    ContentBasedDeduplication?: boolean
    Policy?: {
      Version: string
      Statement: Array<{
        Action: string | Array<string>
        Principal: {
          Service?: string | Array<string>
          AWS: string | Array<string>
        }
        Effect: 'Allow' | 'Deny'
      }>
    }
    Tags?: Record<string, string>
  },
  log: Log = getLog('ENSURE-SQS-QUEUE')
): Promise<SQS.CreateQueueResult> => {
  const {
    Region,
    QueueName,
    VisibilityTimeout = 15 * 60,
    MaximumMessageSize = 64 * 1024,
    MessageRetentionPeriod = 15 * 60,
    DelaySeconds = 0,
    ReceiveMessageWaitTimeSeconds = 0,
    Policy,
    Tags = {}
  } = params

  Tags.Owner = 'reimagined'

  const sqs = new SQS({ region: Region })
  const createSqsQueue = retry(sqs, sqs.createQueue, Options.Defaults.override({ log }))

  try {
    log.debug(`Create a SQS ${QueueName}`)
    const result = await createSqsQueue({
      QueueName: `${QueueName}`,
      Attributes: {
        VisibilityTimeout: `${VisibilityTimeout}`,
        MaximumMessageSize: `${MaximumMessageSize}`,
        MessageRetentionPeriod: `${MessageRetentionPeriod}`,
        DelaySeconds: `${DelaySeconds}`,
        ReceiveMessageWaitTimeSeconds: `${ReceiveMessageWaitTimeSeconds}`,
        Policy: `${JSON.stringify(Policy)}`
      },
      tags: { ...Tags }
    })

    if (result == null) {
      throw new Error('Failed to create SQS queue')
    }
    return result
  } catch (error) {
    log.debug('Failed to create SQS queue')
    throw error
  }
  log.debug(`The SQS queue "${QueueName}" has been created`)
}

export default ensureSqsQueue
