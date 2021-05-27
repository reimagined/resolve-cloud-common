import SQS, { MessageBodyAttributeMap } from 'aws-sdk/clients/sqs'

import { Log, getLog, Options, retry } from '../utils'

const sendMessage = async (
  params: {
    Region: string
    QueueUrl: string
    MessageBody: string
    MessageGroupId?: string
    MessageAttributes?: MessageBodyAttributeMap
  },
  log: Log = getLog('SEND-MESSAGE')
): Promise<void> => {
  const { Region, QueueUrl, MessageBody, MessageGroupId, MessageAttributes } = params
  const sqs = new SQS({ region: Region, apiVersion: '2012-11-05' })

  try {
    log.debug('Sending message')
    const sendMessageExecutor = retry(sqs, sqs.sendMessage, Options.Defaults.override({ log }))
    await sendMessageExecutor({
      QueueUrl,
      MessageBody,
      MessageGroupId,
      MessageAttributes
    })
    log.debug('Sending message succesful complete')
  } catch (error) {
    log.debug('Message not send')
  }
}

export default sendMessage
