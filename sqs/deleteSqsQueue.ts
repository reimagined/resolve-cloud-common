import SQS, { TagKeyList } from 'aws-sdk/clients/sqs'
import STS from 'aws-sdk/clients/sts'
import Resourcegroupstaggingapi from 'aws-sdk/clients/resourcegroupstaggingapi'

import { Log, getLog, Options, retry, ignoreNotFoundException } from '../utils'

const deleteSqsQueue = async (
  params: {
    Region: string
    QueueUrl: string
    QueueName: string
    IfExist?: boolean
  },
  log: Log = getLog('DELETE-SQS-QUEUE')
): Promise<void> => {
  const { Region, QueueUrl, QueueName, IfExist } = params
  const sqs = new SQS({ region: Region })
  const taggingAPI = new Resourcegroupstaggingapi({ region: Region })
  const sts = new STS({ region: Region })

  try {
    log.debug(`Delete the queue "${QueueName}"`)
    const deleteSqsQueueExecutor = retry(sqs, sqs.deleteQueue, Options.Defaults.override({ log }))
    const untagResource = retry(
      taggingAPI,
      taggingAPI.untagResources,
      Options.Defaults.override({ log })
    )
    const listTags = retry(sqs, sqs.listQueueTags, Options.Defaults.override({ log }))

    const { Account } = await sts.getCallerIdentity().promise()

    if (QueueUrl == null || QueueUrl === '') {
      throw new Error('Failed to delete SQS queue')
    }

    const tagKeyList: TagKeyList | undefined = []
    const { Tags } = await listTags({ QueueUrl })

    if (Tags != null) {
      for (const key in Tags) {
        if (key != null || key !== '') {
          tagKeyList.push(key)
        }
      }
    }

    await deleteSqsQueueExecutor({ QueueUrl })

    const QueueArn = `arn:aws:sqs:${Region}:${Account}:${QueueName}`

    try {
      if (tagKeyList != null) {
        await untagResource({
          TagKeys: tagKeyList,
          ResourceARNList: [QueueArn]
        })
      }
      log.debug(`SQS queue tags has been deleted`)
    } catch (error) {
      console.warn(error)
    }    
  } catch (error) {
    if (IfExist) {
      log.debug(`Skip delete the queue "${QueueName}"`)
      ignoreNotFoundException(error)
    }
    log.debug(`Failed to delete the queue "${QueueName}"`)
    throw error
  }
  log.debug(`The queue "${QueueName}" has been deleted`)
}

export default deleteSqsQueue
