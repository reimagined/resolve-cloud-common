import StepFunctions from 'aws-sdk/clients/stepfunctions'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      StepFunctionArn: string
      ExecutionName: string
      Input: {
        [key: string]: any
      }
    },
    log?: Log
  ): Promise<string>
}

const startStepFunctionExecution: TMethod = async (
  { Region, StepFunctionArn, ExecutionName, Input },
  log = getLog('START-STEP-FUNCTION-EXECUTION')
) => {
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
      input: JSON.stringify(Input),
    })
    log.debug(`The execution "${executionArn}" has been started`)
    return executionArn
  } catch (error) {
    log.debug(`Failed to start a execution`)
    throw error
  }
}

export default startStepFunctionExecution
