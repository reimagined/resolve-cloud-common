import { EOL } from 'os'
import chalk from 'chalk'
import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

async function invokeFunction<Response extends any>(
  params: {
    Region: string
    FunctionName: string
    Payload: Record<string, any>
    InvocationType?: 'Event' | 'RequestResponse' | 'DryRun'
    WithLogs?: boolean
  },
  log: Log = getLog('INVOKE-FUNCTION')
): Promise<Response> {
  const { Payload, FunctionName, Region, InvocationType, WithLogs } = params

  const lambda = new Lambda({ region: Region })

  log.debug(`Invoke lambda ${JSON.stringify(FunctionName)}`)
  log.verbose('Payload', Payload)

  try {
    const invoke = retry(lambda, lambda.invoke, Options.Defaults.override({ log, maxAttempts: 30 }))

    const {
      FunctionError,
      Payload: ResponsePayload,
      LogResult
    } = await invoke({
      FunctionName,
      InvocationType,
      Payload: JSON.stringify(Payload),
      ...(WithLogs ? { LogType: 'Tail' } : {})
    })

    if (WithLogs && LogResult != null) {
      const decodedLog = Buffer.from(LogResult, 'base64').toString()
      // eslint-disable-next-line no-console
      console.log(chalk.cyanBright(decodedLog))
    }

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
