import Sns from 'aws-sdk/clients/sns'
import Lambda from 'aws-sdk/clients/lambda'

import { Log, getLog, retry, Options } from '../utils'

const subscribeTopic = async (
  {
    Region,
    TopicArn,
    Endpoint
  }: {
    Region: string
    TopicArn: string
    Endpoint: string
  },
  log: Log = getLog('SUBSCRIBE-SNS-TOPIC')
): Promise<void> => {
  const sns = new Sns({ region: Region })
  const lambda = new Lambda({ region: Region })
  const subscribeSnsTopic = retry(sns, sns.subscribe)

  const addPermission = retry(
    lambda,
    lambda.addPermission,
    Options.Defaults.override({ log, expectedErrors: ['ResourceConflictException'] })
  )

  const removePermission = retry(
    lambda,
    lambda.removePermission,
    Options.Defaults.override({ log, expectedErrors: ['ResourceNotFoundException'] })
  )

  const statementId = TopicArn.split(':')[5]

  if (Endpoint.startsWith('arn:aws:lambda:')) {
    log.verbose('Endpoint is detected as lambda. Removing old lambda permission')

    try {
      await removePermission({
        FunctionName: Endpoint,
        StatementId: statementId
      })

      log.verbose('Old permission removed')
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        log.verbose('Removing old permission failed')
        throw error
      }

      log.verbose('Old permission not found')
    }

    log.verbose('Adding lambda permission')

    try {
      await addPermission({
        FunctionName: Endpoint,
        StatementId: statementId,
        Action: 'lambda:InvokeFunction',
        Principal: 'sns.amazonaws.com',
        SourceArn: TopicArn
      })

      log.verbose('Lambda permission added')
    } catch (error) {
      if (error.name !== 'ResourceConflictException') {
        log.verbose('Adding permission failed')
        throw error
      }

      log.verbose('Lambda permissions already exist')
    }
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
