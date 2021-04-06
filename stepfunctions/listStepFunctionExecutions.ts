import StepFunctions, { ExecutionStatus, ExecutionList } from 'aws-sdk/clients/stepfunctions'

import { retry, Options, getLog, Log } from '../utils'

const listStepFunctionExecutions = async (
  params: {
    Region: string
    StepFunctionArn: string
    StatusFilter?: ExecutionStatus
  },
  log: Log = getLog('LIST-STEP-FUNCTION-EXECUTIONS')
): Promise<ExecutionList> => {
  const { Region, StepFunctionArn, StatusFilter } = params

  const stepFunctions = new StepFunctions({ region: Region })

  const listExecutions = retry(
    stepFunctions,
    stepFunctions.listExecutions,
    Options.Defaults.override({ log })
  )

  const items: ExecutionList = []

  try {
    log.debug(`List step-function executions`)

    let nextToken: string | undefined
    for (;;) {
      log.debug(`Get resources by Marker = ${nextToken ?? '<none>'}`)
      const { nextToken: followingNextToken, executions } = await listExecutions({
        stateMachineArn: StepFunctionArn,
        statusFilter: StatusFilter,
        nextToken
      })

      if (executions != null) {
        executions.map((execution) => items.push(execution))
      }

      if (
        executions == null ||
        executions.length === 0 ||
        followingNextToken == null ||
        followingNextToken === ''
      ) {
        break
      }

      nextToken = followingNextToken
    }
  } catch (error) {
    log.debug(`Failed to get list step-function executions`)
    throw error
  }

  return items
}

export default listStepFunctionExecutions
