import StepFunctions from 'aws-sdk/clients/stepfunctions'

import { retry, Options, getLog, Log } from '../utils'

interface GetStepFunctionArnMethod {
  (params: { Region: string; Name: string }, log: Log): Promise<string>
}

interface GetStepFunctionArnLoop {
  (
    callback: GetStepFunctionArnLoop,
    params: { Region: string; Name: string; NextToken?: string },
    log: Log
  ): Promise<string>
}

const getStepFunctionArnLoop: GetStepFunctionArnLoop = async (
  callback: (...args: any[]) => Promise<any>,
  params: { Region: string; Name: string; NextToken?: string },
  log: Log
) => {
  const { Region, Name, NextToken } = params

  const sf = new StepFunctions({ region: Region })

  const listStateMachines = retry(
    sf,
    sf.listStateMachines,
    Options.Defaults.override({ log, maxAttempts: 1 })
  )
  const { stateMachines, nextToken } = await listStateMachines({
    nextToken: NextToken
  })

  for (const stateMachine of stateMachines) {
    if (stateMachine.name === Name) {
      return stateMachine.stateMachineArn
    }
  }

  if (nextToken != null) {
    return callback(callback, { Region, Name, NextToken: nextToken })
  }

  const error: Error & { code?: string } = new Error(Name)
  error.code = 'StateMachineDoesNotExist'
  throw error
}

const getStepFunctionArn: GetStepFunctionArnMethod = getStepFunctionArnLoop.bind(
  null,
  getStepFunctionArnLoop
)

async function updateStepFunction(
  params: {
    Region: string
    StepFunctionArn: string
    Definition: object
    RoleArn: string
    LoggingConfiguration?: object
  },
  log: Log
): Promise<void> {
  const { Region, StepFunctionArn, Definition, RoleArn, LoggingConfiguration } = params

  const sf = new StepFunctions({ region: Region })

  const putStateMachine = retry(sf, sf.updateStateMachine, Options.Defaults.override({ log }))
  await putStateMachine({
    stateMachineArn: StepFunctionArn,
    definition: JSON.stringify(Definition),
    roleArn: RoleArn,
    loggingConfiguration: LoggingConfiguration
  })
}

async function listStepFunctionTags(
  params: {
    Region: string
    StepFunctionArn: string
  },
  log: Log
): Promise<Array<{ key?: string; value?: string }>> {
  const { Region, StepFunctionArn } = params

  const sf = new StepFunctions({ region: Region })

  const listTags = retry(
    sf,
    sf.listTagsForResource,
    Options.Defaults.override({ log, maxAttempts: 1 })
  )
  const { tags = [] } = await listTags({
    resourceArn: StepFunctionArn
  })

  return tags
}

async function tagStepFunction(
  params: {
    Region: string
    StepFunctionArn: string
    Tags: Array<{ key?: string; value?: string }>
  },
  log: Log
): Promise<void> {
  const { Region, StepFunctionArn, Tags } = params

  const sf = new StepFunctions({ region: Region })

  const addTags = retry(sf, sf.tagResource, Options.Defaults.override({ log, maxAttempts: 1 }))
  await addTags({
    resourceArn: StepFunctionArn,
    tags: Tags
  })
}

async function untagStepFunction(
  params: {
    Region: string
    StepFunctionArn: string
    TagKeys: Array<string>
  },
  log: Log
): Promise<void> {
  const { Region, StepFunctionArn, TagKeys } = params

  const sf = new StepFunctions({ region: Region })

  const removeTags = retry(sf, sf.untagResource, Options.Defaults.override({ log, maxAttempts: 1 }))
  await removeTags({
    resourceArn: StepFunctionArn,
    tagKeys: TagKeys
  })
}

async function createStepFunction(
  params: {
    Region: string
    Tags: Array<{ key?: string; value?: string }>
    Definition: object
    Name: string
    RoleArn: string
    Type: string
    LoggingConfiguration?: object
  },
  log: Log
): Promise<string> {
  const { Region, Tags, Definition, Name, RoleArn, Type, LoggingConfiguration } = params

  const sf = new StepFunctions({ region: Region })

  const addStateMachine = retry(sf, sf.createStateMachine, Options.Defaults.override({ log }))
  const { stateMachineArn } = await addStateMachine({
    name: Name,
    roleArn: RoleArn,
    definition: JSON.stringify(Definition),
    tags: Tags,
    type: Type,
    loggingConfiguration: LoggingConfiguration
  })

  return stateMachineArn
}

interface ListRunningExecutionsLoop {
  (
    callback: ListRunningExecutionsLoop,
    params: { Region: string; StepFunctionArn: string; NextToken?: string; Result?: Array<string> },
    log: Log
  ): Promise<Array<string>>
}

interface ListRunningExecutionsMethod {
  (params: { Region: string; StepFunctionArn: string }, log: Log): Promise<Array<string>>
}

const listRunningExecutionsLoop: ListRunningExecutionsLoop = async (
  callback,
  { Region, StepFunctionArn, NextToken, Result = [] },
  log: Log
) => {
  const sf = new StepFunctions({ region: Region })

  const listExecutions = retry(
    sf,
    sf.listExecutions,
    Options.Defaults.override({ log, maxAttempts: 1 })
  )
  const { nextToken, executions } = await listExecutions({
    stateMachineArn: StepFunctionArn,
    nextToken: NextToken,
    statusFilter: 'RUNNING'
  })

  for (const { executionArn } of executions) {
    Result.push(executionArn)
  }

  if (nextToken != null) {
    return callback(
      callback,
      {
        Region,
        StepFunctionArn,
        NextToken: nextToken,
        Result
      },
      log
    )
  }

  return Result
}

const listRunningExecutions: ListRunningExecutionsMethod = listRunningExecutionsLoop.bind(
  null,
  listRunningExecutionsLoop
)

async function stopExecution(
  params: { Region: string; ExecutionArn: string },
  log: Log
): Promise<void> {
  const { Region, ExecutionArn } = params

  const sf = new StepFunctions({ region: Region })

  const throttleExecution = retry(
    sf,
    sf.stopExecution,
    Options.Defaults.override({ log, maxAttempts: 1 })
  )
  await throttleExecution({ executionArn: ExecutionArn })
}

interface TMethod {
  (
    params: {
      Region: string
      Tags?: { [key: string]: string }
      Definition: object
      Name: string
      RoleArn: string
      Type?: string
      LoggingConfiguration?: object
    },
    log?: Log
  ): Promise<string>
}

const ensureStepFunction: TMethod = async (
  {
    Region,
    Tags: { ...RawTags } = {},
    Definition,
    Name,
    RoleArn,
    Type = 'STANDARD',
    LoggingConfiguration
  },
  log = getLog('ENSURE-STEP-FUNCTION')
) => {
  delete RawTags.Owner

  const Tags = [
    ...Array.from(Object.entries(RawTags)).map(([key, value]) => ({
      key,
      value
    })),
    {
      key: 'Owner',
      value: 'reimagined'
    }
  ]

  log.verbose({
    Region,
    Tags,
    Definition,
    Name,
    RoleArn
  })

  try {
    log.debug('Get step function ARN')
    const StepFunctionArn = await getStepFunctionArn(
      {
        Region,
        Name
      },
      log
    )
    log.debug(`Step function ARN has been got: ${StepFunctionArn}`)

    log.debug('Update step function')
    await updateStepFunction(
      {
        Region,
        StepFunctionArn,
        Definition,
        RoleArn,
        LoggingConfiguration
      },
      log
    )
    log.debug('Step function has been updated')

    log.debug('List step function tags')
    const prevTags = await listStepFunctionTags(
      {
        Region,
        StepFunctionArn
      },
      log
    )
    log.debug('Step function tags have been listed')

    const nextTags: Array<{ key?: string; value?: string }> = [...prevTags]
    for (const { key, value } of Tags) {
      const index = nextTags.findIndex(({ key: prevKey }) => prevKey === key)
      if (index >= 0) {
        nextTags[index] = { key, value }
      } else {
        nextTags.push({ key, value })
      }
    }

    const ensuredTags: Array<{ key?: string; value?: string }> = []
    const dropTags: Array<string> = []
    for (const { key, value } of nextTags) {
      const index = Tags.findIndex(({ key: prevKey }) => prevKey === key)

      if (index >= 0) {
        ensuredTags.push({ key, value })
      } else if (key != null) {
        dropTags.push(key)
      }
    }

    log.debug('Set step function tags')
    await tagStepFunction(
      {
        Region,
        StepFunctionArn,
        Tags: ensuredTags
      },
      log
    )
    log.debug('Step function tags have been set')

    log.debug('Delete step function tags')
    await untagStepFunction(
      {
        Region,
        StepFunctionArn,
        TagKeys: dropTags
      },
      log
    )
    log.debug('Function tags have been deleted')

    if (Type !== 'EXPRESS') {
      for (;;) {
        log.debug('List running executions')
        const executionArns = await listRunningExecutions({ Region, StepFunctionArn }, log)
        log.debug(`Running executions have been listed in amount of ${executionArns.length}`)

        log.verbose(executionArns)

        if (executionArns.length === 0) {
          break
        }

        log.debug('Stop running executions')
        await Promise.all(
          executionArns.map(executionArn =>
            stopExecution(
              {
                Region,
                ExecutionArn: executionArn
              },
              log
            )
          )
        )
        log.debug('Running executions have been stopped')
      }
    } else {
      log.debug('Skip stopping of running executions for EXPRESS type')
    }

    return StepFunctionArn
  } catch (error) {
    if (error.code === 'StateMachineDoesNotExist') {
      log.debug('Create step function')
      const StepFunctionArn = await createStepFunction(
        {
          Region,
          Tags,
          Definition,
          Name,
          RoleArn,
          Type,
          LoggingConfiguration
        },
        log
      )
      log.debug(`Step function with Arn ${StepFunctionArn} has been created`)

      return StepFunctionArn
    }
    throw error
  }
}

export default ensureStepFunction
