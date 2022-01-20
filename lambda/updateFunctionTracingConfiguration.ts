import updateFunctionConfiguration from './updateFunctionConfiguration'
import { getLog, Log } from '../utils'

const updateFunctionTracingConfiguration = async (
  params: {
    Region: string
    FunctionName: string
    Mode: 'Active' | 'PassThrough'
    Variables?: {
      [key: string]: string | null
    }
  },
  log: Log = getLog('UPDATE-FUNCTION-TRACING-CONFIGURATION')
): Promise<void> => {
  const { Region, FunctionName, Mode, Variables } = params

  try {
    log.debug(`Update the function "${FunctionName}" tracing mode`)

    await updateFunctionConfiguration({
      Region,
      FunctionName,
      TracingConfig: {
        Mode
      },
      Variables
    })
    log.debug(`The function "${FunctionName}" tracing mode has been updated`)
  } catch (error) {
    log.debug(`Failed to update the function "${FunctionName}" tracing mode`)
    throw error
  }
}

export default updateFunctionTracingConfiguration
