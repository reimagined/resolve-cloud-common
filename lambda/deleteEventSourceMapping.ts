import Lambda from 'aws-sdk/clients/lambda'
import { Log, Options, retry, getLog } from '../utils'

const deleteEventSourceMapping = async (
  params: {
    UUID: string
    Region: string
  },
  log: Log = getLog('DELETE-EVENT-SOURCE-MAPPING')
): Promise<Lambda.EventSourceMappingConfiguration> => {
  const { UUID, Region } = params
  const lambda = new Lambda({ region: Region })
  const deleteEventSourceMappingExecutor = retry(
    lambda,
    lambda.deleteEventSourceMapping,
    Options.Defaults.override({ log })
  )
  try {
    log.debug('Delete an event source mapping')
    const result = await deleteEventSourceMappingExecutor({ UUID })
    if (result == null) {
      throw new Error('Failed to delete event source mapping')
    }
    log.debug(`Event source mapping with UUID "${UUID}" has been delete`)
    return result
  } catch (error) {
    log.debug('Failed to delete event source mapping')
    throw error
  }
}

export default deleteEventSourceMapping
