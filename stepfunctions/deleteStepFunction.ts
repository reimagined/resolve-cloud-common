import StepFunctions from 'aws-sdk/clients/stepfunctions'

import { retry, Options, getLog, Log } from '../utils'

import { ignoreNotFoundException } from '../utils/ignoreNotFoundException'

async function processPage(
  params: { Region: string; StepFunctionArn: string },
  log: Log,
  page?: object
): Promise<void> {
  const { Region, StepFunctionArn } = params

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

const deleteStepFunction = async (
  params: { Region: string; StepFunctionArn: string; IfExists?: boolean },
  log: Log = getLog('DELETE-STATE-MACHINE')
): Promise<void> => {
  const { Region, StepFunctionArn, IfExists } = params

  const stepFunctions = new StepFunctions({ region: Region })

  const removeStateMachine = retry(
    stepFunctions,
    stepFunctions.deleteStateMachine,
    Options.Defaults.override({ log })
  )

  const describeStateMachine = retry(
    stepFunctions,
    stepFunctions.describeStateMachine,
    Options.Defaults.override({ log, maxAttempts: 1 })
  )

  const listTagsForResource = retry(
    stepFunctions,
    stepFunctions.listTagsForResource,
    Options.Defaults.override({ log, maxAttempts: 1 })
  )

  const untagResource = retry(
    stepFunctions,
    stepFunctions.untagResource,
    Options.Defaults.override({ log, maxAttempts: 1 })
  )

  const { tags } = await listTagsForResource({
    stateMachineArn: StepFunctionArn
  })

  const tagKeys: Array<string> = []

  for (const { key } of tags ?? []) {
    if (key != null) {
      tagKeys.push(key)
    }
  }

  try {
    await untagResource({
      resourceArn: StepFunctionArn,
      tagKeys
    })
  } catch (error) {
    log.warn(error)
  }

  log.debug(`Enumerate and stop active executions`)
  await processPage({ Region, StepFunctionArn }, log)

  try {
    log.debug(`Delete step function "${StepFunctionArn}"`)
    await removeStateMachine({
      stateMachineArn: StepFunctionArn
    })
    log.debug(`Step function "${StepFunctionArn}" has been deleted`)

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
  } catch (error) {
    if (IfExists) {
      log.debug(`Skip delete step function "${StepFunctionArn}"`)
      ignoreNotFoundException(error)
    } else {
      log.debug(`Failed to delete step function "${StepFunctionArn}"`)
      throw error
    }
  }
}

export default deleteStepFunction
