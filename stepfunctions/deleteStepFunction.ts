import StepFunctions from 'aws-sdk/clients/stepfunctions'

import { retry, Options, getLog, Log } from '../utils'

import { ignoreNotFoundException } from '../utils/ignoreNotFoundException'

interface TParams {
  Region: string
  StepFunctionArn: string
}

interface TMethod {
  (params: TParams, log?: Log): Promise<void>
}

async function processPage(
  { Region, StepFunctionArn }: TParams,
  log: Log,
  page?: object
): Promise<void> {
  const stepFunctions = new StepFunctions({ region: Region })

  log.debug(`Request running executions`)

  const listExecutions = retry(
    stepFunctions,
    stepFunctions.listExecutions,
    Options.Defaults.override({ log })
  )

  const result = await listExecutions({
    stateMachineArn: StepFunctionArn,
    statusFilter: 'RUNNING',
    maxResults: 30,
    ...page
  })

  await Promise.all(
    result.executions.map(({ executionArn, name }) => {
      log.debug(`Stop the execution "${name}" of step function "${StepFunctionArn}"`)

      const stopExecution = retry(
        stepFunctions,
        stepFunctions.stopExecution,
        Options.Defaults.override({ log })
      )
      return stopExecution({
        executionArn,
        cause: 'Delete the step function'
      })
    })
  )

  const { nextToken } = result
  if (nextToken != null) {
    await processPage({ Region, StepFunctionArn }, log, { nextToken })
  }
}

const deleteStepFunction: TMethod = async (
  { Region, StepFunctionArn },
  log = getLog('DELETE-STATE-MACHINE')
) => {
  const stepFunctions = new StepFunctions({ region: Region })

  log.debug(`Enumerate and stop active executions`)
  await processPage({ Region, StepFunctionArn }, log)

  try {
    log.debug(`Delete step function "${StepFunctionArn}"`)
    const removeStateMachine = retry(
      stepFunctions,
      stepFunctions.deleteStateMachine,
      Options.Defaults.override({ log })
    )
    await removeStateMachine({
      stateMachineArn: StepFunctionArn
    })

    const describeStateMachine = retry(
      stepFunctions,
      stepFunctions.describeStateMachine,
      Options.Defaults.override({ log, maxAttempts: 1 })
    )

    log.debug('Wait for deleting')
    for (;;) {
      if (
        (await describeStateMachine({
          stateMachineArn: StepFunctionArn
        }).catch(ignoreNotFoundException)) == null
      ) {
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    log.debug(`Step function "${StepFunctionArn}" has been deleted`)
  } catch (error) {
    log.debug(`Failed to delete step function "${StepFunctionArn}"`)
    throw error
  }

  log.debug(`Step function "${StepFunctionArn}" has been deleted`)
}

export default deleteStepFunction
