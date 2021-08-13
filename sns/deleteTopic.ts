import SNS from 'aws-sdk/clients/sns'

import { Log, getLog, retry } from '../utils'

const deleteTopic = async (
  {
    Region,
    TopicArn
  }: {
    Region: string
    TopicArn: string
  },
  log: Log = getLog('DELETE-SNS-TOPIC')
): Promise<void> => {
  const sns = new SNS({ region: Region })
  const deleteSnsTopic = retry(sns, sns.deleteTopic)
  const unsubscribeSnsTopic = retry(sns, sns.unsubscribe)
  const listSubscriptions = retry(sns, sns.listSubscriptionsByTopic)

  try {
    log.verbose('Getting of topic subscriptions')

    const { Subscriptions } = await listSubscriptions({
      TopicArn
    })

    if (Subscriptions == null) {
      throw new Error('Subscriptions are not found')
    }

    log.verbose('Unsubscribing SNS topic')

    for (const { SubscriptionArn } of Subscriptions) {
      if (SubscriptionArn != null) {
        await unsubscribeSnsTopic({
          SubscriptionArn
        })
      }
    }

    log.verbose('SNS topic unsubscribed')

    log.verbose(`Deleting SNS topic "${TopicArn}"`)
    await deleteSnsTopic({ TopicArn })
    log.verbose(`SNS topic "${TopicArn}" deleted`)
  } catch (error) {
    log.verbose(`SNS topic "${TopicArn}" deleting failed`)
    throw error
  }
}

export default deleteTopic
