import SNS from 'aws-sdk/clients/sns'

import { Log, getLog, retry } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      TopicArn: string
    },
    log?: Log
  ): Promise<void>
}

const deleteTopic: TMethod = async ({ Region, TopicArn }, log = getLog('DELETE-SNS-TOPIC')) => {
  const sns = new SNS({ region: Region })
  const deleteSnsTopic = retry(sns, sns.deleteTopic)

  log.verbose(`Deleting SNS topic "${TopicArn}"`)

  try {
    await deleteSnsTopic({ TopicArn })
    log.verbose(`SNS topic "${TopicArn}" deleted`)
  } catch (error) {
    log.verbose(`SNS topic "${TopicArn}" deleting failed`)
    throw error
  }
}

export default deleteTopic
