import updateFunctionConfiguration from './updateFunctionConfiguration'
import { getLog, Log } from '../utils'

const updateFunctionTracingMode = async (
  params: {
    Region: string
    FunctionName: string
    Mode: 'Active' | 'PassThrough'
  },
  log: Log = getLog('UPDATE-FUNCTION-TRACING-MODE')
): Promise<void> => {
  const { Region, FunctionName, Mode } = params

  try {
    log.debug(`Update the function "${FunctionName}" tracing mode`)

    await updateFunctionConfiguration({
      Region,
      FunctionName,
      TracingConfig: {
        Mode
      }
    })
    log.debug(`The function "${FunctionName}" tracing mode has been updated`)
  } catch (error) {
    log.debug(`Failed to update the function "${FunctionName}" tracing mode`)
    throw error
  }
}

export default updateFunctionTracingMode
