import { EOL } from 'os'
import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

async function invokeFunction<Response extends object | null>(
  params: {
    Region: string
    FunctionName: string
    Payload: object
    InvocationType?: 'Event' | 'RequestResponse' | 'DryRun'
  },
  log: Log = getLog('INVOKE-FUNCTION')
): Promise<Response> {
  const { Payload, FunctionName, Region, InvocationType } = params

  const lambda = new Lambda({ region: Region })

  log.debug(`Invoke lambda ${JSON.stringify(FunctionName)}`)
  log.verbose('Payload', Payload)

  try {
    const invoke = retry(lambda, lambda.invoke, Options.Defaults.override({ log }))
    const { FunctionError, Payload: ResponsePayload } = await invoke({
      FunctionName,
      InvocationType,
      Payload: JSON.stringify(Payload)
    })

    if (FunctionError != null && (InvocationType === 'RequestResponse' || InvocationType == null)) {
      const { errorMessage, trace, errorType } =
        ResponsePayload == null
          ? { errorMessage: 'Unknown error', trace: null, errorType: 'Error' }
          : JSON.parse(ResponsePayload.toString())
      const error = new Error(errorMessage)
      error.name = errorType
      error.stack = Array.isArray(trace)
        ? trace.join(EOL)
        : `Error: ${errorMessage} at "${FunctionName}"`
      throw error
    }

    const result: Response =
      (InvocationType === 'RequestResponse' || InvocationType == null) && ResponsePayload != null
        ? JSON.parse(ResponsePayload.toString())
        : null

    log.debug(`Lambda ${JSON.stringify(FunctionName)} has been invoked`)
    log.verbose('Result', result)

    return result
  } catch (error) {
    log.debug(`Failed to invoke lambda ${JSON.stringify(FunctionName)}`)
    log.error(error.message)
    throw error
  }
}

export default invokeFunction
