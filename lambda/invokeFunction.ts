import { EOL } from 'os'
import chalk from 'chalk'
import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log, toleratedErrors } from '../utils'

async function invokeFunction<Response extends any>(
  params: {
    Region: string
    FunctionName: string
    Payload: Record<string, any>
    InvocationType?: 'Event' | 'RequestResponse' | 'DryRun' | 'RequestOnly'
    WithLogs?: boolean
    MaximumExecutionDuration?: number
  },
  log: Log = getLog('INVOKE-FUNCTION')
): Promise<Response> {
  const {
    Payload,
    FunctionName,
    Region,
    InvocationType,
    WithLogs,
    MaximumExecutionDuration = 300000
  } = params

  const lambda = new Lambda({
    region: Region,
    maxRetries: 0,
    ...(InvocationType !== 'RequestOnly'
      ? {
          httpOptions: { timeout: MaximumExecutionDuration }
        }
      : {})
  })

  log.debug(`Invoke lambda ${JSON.stringify(FunctionName)}`)
  log.verbose('Payload', Payload)

  try {
    if (InvocationType != null && InvocationType === 'RequestOnly') {
      for (;;) {
        const invoke = lambda.invoke({
          FunctionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(Payload),
          ...(WithLogs ? { LogType: 'Tail' } : {})
        })

        try {
          await new Promise((resolve, reject) => {
            invoke.on('httpUploadProgress', () => setTimeout(resolve, MaximumExecutionDuration))
            invoke.promise().catch(reject)
          })
          break
        } catch (error) {
          if (!(error != null && error.code != null && toleratedErrors.includes(error.code))) {
            throw error
          }

          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      return undefined as Response
    } else {
      const invoke = retry(
        lambda,
        lambda.invoke,
        Options.Defaults.override({ log, maxAttempts: 30, expectedErrors: ['TimeoutError'] })
      )

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

      if (
        FunctionError != null &&
        (InvocationType === 'RequestResponse' || InvocationType == null)
      ) {
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
    }
  } catch (error) {
    log.debug(`Failed to invoke lambda ${JSON.stringify(FunctionName)}`)
    log.error(error.message)
    throw error
  }
}

export default invokeFunction
