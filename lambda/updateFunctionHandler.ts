import updateFunctionConfiguration from './updateFunctionConfiguration'
import { getLog, Log } from '../utils'

const updateFunctionHandler = async (
  params: {
    Region: string
    FunctionName: string
    Handler: string
  },
  log: Log = getLog('UPDATE-FUNCTION-HANDLER')
): Promise<void> => {
  const { Region, FunctionName, Handler } = params

  try {
    log.debug(`Update the function "${FunctionName}" handler`)

    await updateFunctionConfiguration({
      Region,
      FunctionName,
      Handler
    })
    log.debug(`The function "${FunctionName}" handler has been updated`)
  } catch (error) {
    log.debug(`Failed to update the function "${FunctionName}" handler`)
    throw error
  }
}

export default updateFunctionHandler
