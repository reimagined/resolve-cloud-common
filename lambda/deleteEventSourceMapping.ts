import Lambda from 'aws-sdk/clients/lambda'
import STS from 'aws-sdk/clients/sts'
import deleteFunctionPermission from './deleteFunctionPermission'

import { Log, Options, retry, getLog } from '../utils'

const deleteEventSourceMapping = async (
  params: {
    UUID: string
    Region: string
    FunctionName: string
    QueueName: string
  },
  log: Log = getLog('DELETE-EVENT-SOURCE-MAPPING')
): Promise<void> => {
  const { UUID, Region, FunctionName, QueueName } = params
  const lambda = new Lambda({ region: Region })
  const sts = new STS({ region: Region })
  const deleteEventSourceMappingExecutor = retry(
    lambda,
    lambda.deleteEventSourceMapping,
    Options.Defaults.override({ log })
  )
  const getPolicy = retry(lambda, lambda.getPolicy, Options.Defaults.override({ log }))
  try {
    log.debug('Delete event source mapping')
    const createResult = await deleteEventSourceMappingExecutor({ UUID })
    if (createResult == null) {
      throw new Error('Failed to delete event source mapping')
    }
    log.debug(`Event source mapping with UUID "${UUID}" has been delete`)
    log.debug(`Delete the function "${FunctionName}" permission`)
    const policy = await getPolicy({ FunctionName })
    if (policy.Policy == null || policy.Policy === '') {
      throw new Error('Failed to delete event source mapping')
    }
    const result = JSON.parse(policy.Policy)
    const { Account } = await sts.getCallerIdentity().promise()
    const queueArn = `arn:aws:sqs:${Region}:${Account}:${QueueName}`

    for (const item of result.Statement) {
      if (item.Condition.ArnLike['AWS:SourceArn'] === queueArn) {
        await deleteFunctionPermission({
          Region,
          FunctionName,
          StatementId: item.Sid
        })
      }
    }
    log.debug(`The function "${FunctionName}" permission has been deleted`)
  } catch (error) {
    log.debug('Failed to delete event source mapping')
  }
}

export default deleteEventSourceMapping
