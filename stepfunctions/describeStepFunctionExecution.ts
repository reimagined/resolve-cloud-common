import StepFunctions, { ExecutionStatus } from 'aws-sdk/clients/stepfunctions'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      ExecutionArn: string
    },
    log?: Log
  ): Promise<ExecutionStatus>
}

const describeStepFunctionExecution: TMethod = async (
  { Region, ExecutionArn },
  log = getLog('DESCRIBE-STEP-FUNCTION-EXECUTION')
) => {
  const stepFunctions = new StepFunctions({ region: Region })

  const describeExecution = retry(
    stepFunctions,
    stepFunctions.describeExecution,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Describe the execution "${ExecutionArn}" status`)
    const { status: executionStatus } = await describeExecution({
      executionArn: ExecutionArn,
    })
    log.debug(`The execution "${ExecutionArn}" status = "${executionStatus}"`)
    return executionStatus
  } catch (error) {
    log.debug(`Failed to describe the execution "${ExecutionArn}" status`)
    throw error
  }
}

export default describeStepFunctionExecution
