import StepFunctions from 'aws-sdk/clients/stepfunctions'

import { retry, Options, getLog } from '../utils'

const describeStepFunctionExecution = async (
  params: {
    Region: string
    ExecutionArn: string
  },
  log = getLog('DESCRIBE-STEP-FUNCTION-EXECUTION')
): Promise<{
  Status: string
  Output: Record<string, any> | null
}> => {
  const { Region, ExecutionArn } = params
  const stepFunctions = new StepFunctions({ region: Region })

  const describeExecution = retry(
    stepFunctions,
    stepFunctions.describeExecution,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Describe the execution "${ExecutionArn}" status`)
    const { status: executionStatus, output: executionOutput } = await describeExecution({
      executionArn: ExecutionArn
    })
    log.debug(`The execution "${ExecutionArn}" status = "${executionStatus}"`)
    return {
      Status: executionStatus,
      Output: executionOutput != null ? JSON.parse(executionOutput) : null
    }
  } catch (error) {
    log.debug(`Failed to describe the execution "${ExecutionArn}" status`)
    throw error
  }
}

export default describeStepFunctionExecution
