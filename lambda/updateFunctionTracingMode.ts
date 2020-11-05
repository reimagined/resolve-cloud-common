import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

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

    const lambda = new Lambda({ region: Region })

    const updateFunctionConfiguration = retry(
      lambda,
      lambda.updateFunctionConfiguration,
      Options.Defaults.override({ log, maxAttempts: 5, delay: 5000 })
    )
    await updateFunctionConfiguration({
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
