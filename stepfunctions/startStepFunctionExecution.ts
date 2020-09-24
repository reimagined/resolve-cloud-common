import StepFunctions from 'aws-sdk/clients/stepfunctions'

import { retry, Options, getLog, Log } from '../utils'

const startStepFunctionExecution = async (
  params: {
    Region: string
    StepFunctionArn: string
    ExecutionName: string
    Input: Record<string, any>
  },
  log: Log = getLog('START-STEP-FUNCTION-EXECUTION')
): Promise<string> => {
  const { Region, StepFunctionArn, ExecutionName, Input } = params

  const stepFunctions = new StepFunctions({ region: Region })

  const startExecution = retry(
    stepFunctions,
    stepFunctions.startExecution,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Start an execution`)
    const { executionArn } = await startExecution({
      stateMachineArn: StepFunctionArn,
      name: ExecutionName,
      input: JSON.stringify(Input)
    })
    log.debug(`The execution "${executionArn}" has been started`)
    return executionArn
  } catch (error) {
    log.debug(`Failed to start a execution`)
    throw error
  }
}

export default startStepFunctionExecution
