import Lambda from 'aws-sdk/clients/lambda'
import { Log, Options, retry, getLog } from '../utils'

const deleteEventSourceMapping = async (
  params: {
    UUID: string
    Region: string
  },
  log: Log = getLog('DELETE-EVENT-SOURCE-MAPPING')
): Promise<void> => {
  const { UUID, Region } = params
  const lambda = new Lambda({ region: Region })
  const deleteEventSourceMappingExecutor = retry(
    lambda,
    lambda.deleteEventSourceMapping,
    Options.Defaults.override({ log })
  )
  try {
    log.debug('Delete event source mapping')
    const createResult = await deleteEventSourceMappingExecutor({ UUID })
    if (createResult == null) {
      throw new Error('Failed to delete event source mapping')
    }
    log.debug(`Event source mapping with UUID "${UUID}" has been delete`)
  } catch (error) {
    log.debug('Failed to delete event source mapping')
  }
}

export default deleteEventSourceMapping
