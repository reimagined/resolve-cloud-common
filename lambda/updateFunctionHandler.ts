import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      FunctionName: string
      Handler: string
    },
    log?: Log
  ): Promise<void>
}

const updateFunctionHandler: TMethod = async (
  { Region, FunctionName, Handler },
  log: Log = getLog('UPDATE-FUNCTION-HANDLER')
) => {
  try {
    log.debug(`Update the function "${FunctionName}" handler`)

    const lambda = new Lambda({ region: Region })

    const updateFunctionConfiguration = retry(
      lambda,
      lambda.updateFunctionConfiguration,
      Options.Defaults.override({ log, maxAttempts: 1 })
    )
    await updateFunctionConfiguration({
      FunctionName,
      Handler,
    })
    log.debug(`The function "${FunctionName}" handler has been updated`)
  } catch (error) {
    log.debug(`Failed to update the function "${FunctionName}" handler`)
    throw error
  }
}

export default updateFunctionHandler
