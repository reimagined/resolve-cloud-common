import Sns from 'aws-sdk/clients/sns'
import Lambda from 'aws-sdk/clients/lambda'
import { v4 as uuid } from 'uuid'

import { Log, getLog, retry, Options } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      TopicArn: string
      Endpoint: string
    },
    log?: Log
  ): Promise<void>
}

const subscribeTopic: TMethod = async (
  { Region, TopicArn, Endpoint },
  log = getLog('SUBSCRIBE-SNS-TOPIC')
) => {
  const sns = new Sns({ region: Region })
  const lambda = new Lambda({ region: Region })
  const subscribeSnsTopic = retry(sns, sns.subscribe)
  const addPermission = retry(lambda, lambda.addPermission, Options.Defaults.override({ log }))

  try {
    if (Endpoint.startsWith('arn:aws:lambda:')) {
      log.verbose('Endpoint is detected as lambda. Adding permissions')

      await addPermission({
        FunctionName: Endpoint,
        StatementId: uuid(),
        Action: 'lambda:InvokeFunction',
        Principal: 'sns.amazonaws.com',
        SourceArn: TopicArn
      })

      log.verbose('Lambda permissions added')
    }
  } catch (error) {
    log.verbose('SNS topic subscribing failed')
    throw error
  }

  try {
    log.verbose('Subscribing SNS topic')

    await subscribeSnsTopic({
      TopicArn,
      Endpoint,
      Protocol: 'lambda'
    })

    log.verbose('SNS topic subscribed')
  } catch (error) {
    log.verbose('SNS topic subscribing failed')
    throw error
  }
}

export default subscribeTopic
