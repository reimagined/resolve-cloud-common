import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      FunctionName: string
      Payload: object
      InvocationType?: 'Event' | 'RequestResponse' | 'DryRun'
    },
    log?: Log
  ): Promise<object | null>
}

const invokeFunction: TMethod = async (
  { Region, FunctionName, Payload, InvocationType },
  log = getLog('INVOKE-FUNCTION')
) => {
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
      const { errorMessage } =
        ResponsePayload == null
          ? { errorMessage: 'Unknown error' }
          : JSON.parse(ResponsePayload.toString())
      throw new Error(errorMessage)
    }

    const result =
      InvocationType === ('RequestResponse' || InvocationType == null) && ResponsePayload != null
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
