import SNS from 'aws-sdk/clients/sns'

import { Log, getLog, retry } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Name: string
      Tags: Array<{ Key: string; Value: string }>
    },
    log?: Log
  ): Promise<{ TopicArn: string }>
}

const createTopic: TMethod = async ({ Region, Name, Tags }, log = getLog('CREATE-SNS-TOPIC')) => {
  const sns = new SNS({ region: Region })
  const createSnsTopic = retry(sns, sns.createTopic)

  log.verbose(`Creating SNS topic "${Name}"`)

  try {
    const { TopicArn } = await createSnsTopic({ Name, Tags })

    if (TopicArn == null) {
      throw new Error('TopicArn is not defined')
    }

    log.verbose(`SNS topic "${Name}" created`)
    return { TopicArn }
  } catch (error) {
    log.verbose(`SNS topic "${Name}" creating failed`)
    throw error
  }
}

export default createTopic
