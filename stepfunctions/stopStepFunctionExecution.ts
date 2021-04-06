import StepFunctions from 'aws-sdk/clients/stepfunctions'

import { retry, Options, getLog, Log } from '../utils'

const stopStepFunctionExecution = async (
  params: {
    Region: string
    ExecutionArn: string
    Cause?: string
    Error?: string
  },
  log: Log = getLog('STOP-STEP-FUNCTION-EXECUTION')
): Promise<void> => {
  const { Region, ExecutionArn, Cause, Error } = params

  const stepFunctions = new StepFunctions({ region: Region })

  const stopExecution = retry(
    stepFunctions,
    stepFunctions.stopExecution,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Stop an execution`)

    await stopExecution({ executionArn: ExecutionArn, cause: Cause, error: Error })

    log.debug(`The execution "${ExecutionArn}" has been stopped`)
  } catch (error) {
    log.debug(`Failed to stop the execution "${ExecutionArn}"`)
    throw error
  }
}

export default stopStepFunctionExecution
