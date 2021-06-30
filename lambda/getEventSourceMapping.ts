import Lambda from 'aws-sdk/clients/lambda'
import { Log, getLog, Options, retry } from '../utils'

const getEventSourceMapping = async (
  params: {
    Region: string,
    UUID: string
  },
  log: Log = getLog('GET-EVENTSOURCE-MAPPING')
): Promise<Lambda.EventSourceMappingConfiguration> => {
  const { Region, UUID } = params
  const lambda = new Lambda({ region: Region })
  const getEventSourceMappingExecutor = retry(lambda, lambda.getEventSourceMapping, Options.Defaults.override({ log }))

  try {
    log.debug('Getting a event source mapping')    
    const result = await getEventSourceMappingExecutor({ UUID })
    if (result == null) {
      throw new Error(`Event source mapping ${UUID} not found`)
    }
    log.debug('Event source mapping have been got')
    return result
  } catch (error) {
    log.debug('Failed to get event source mapping')
    log.debug(error)
    throw error
  }  
}

export default getEventSourceMapping
