import SQS from 'aws-sdk/clients/sqs'

import { Log, getLog, Options, retry } from '../utils'

const receiveMessage = async (
  params: {
    Region: string
    QueueUrl: string
    WaitTimeSeconds?: number
    MessageAttributeNames?: Array<string>
    MaxNumberOfMessages?: number
    VisibilityTimeout?: number
  },
  log: Log = getLog('RECEIVE-MESSAGE')
) => {
  const {
    QueueUrl,
    Region,
    WaitTimeSeconds = 0,
    MessageAttributeNames = ['All'],
    MaxNumberOfMessages = 1,
    VisibilityTimeout = 0
  } = params
  const sqs = new SQS({ region: Region })

  try {
    log.debug(`Receiving message`)
    const receiveMessageExecutor = retry(
      sqs,
      sqs.receiveMessage,
      Options.Defaults.override({ log })
    )

    const result = await receiveMessageExecutor({
      QueueUrl,
      WaitTimeSeconds,
      MessageAttributeNames,
      MaxNumberOfMessages,
      VisibilityTimeout
    })

    if (result == null) {
      throw new Error('Failed to receive message SQS queue')
    }

    log.debug('Message succesfully receive')
  } catch (error) {
    log.debug(error)
  }
}

export default receiveMessage
