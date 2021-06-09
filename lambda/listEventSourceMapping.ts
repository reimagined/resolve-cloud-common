import Lambda from 'aws-sdk/clients/lambda'
import { Log, Options, retry, getLog } from '../utils'

const listEventSourceMapping = async (
  params: {
    FunctionName: string
    Region: string
  },
  log: Log = getLog('DELETE-EVENT-SOURCE-MAPPING')
): Promise<Lambda.ListEventSourceMappingsResponse> => {
  const { FunctionName, Region } = params
  const lambda = new Lambda({region: Region})

  const listEventSourceMappingExecutor = retry(lambda, lambda.listEventSourceMappings, Options.Defaults.override({ log }))

  try {
    log.debug('List event source mappings')
    const result = await listEventSourceMappingExecutor({
      FunctionName
    })
    log.debug('List event source mappings executed succesfuly')    
    return result
  } catch (error) {
    log.debug('Failed to get list event source mapping')
    throw error
  }
}

export default listEventSourceMapping
