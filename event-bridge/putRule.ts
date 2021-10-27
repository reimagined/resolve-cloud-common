import { v4 as uuidV4 } from 'uuid'
import EventBridge from 'aws-sdk/clients/eventbridge'

import { addFunctionPermission } from '../lambda'
import { retry, Options, getLog, Log } from '../utils'

const putRule = async (
  params: {
    Region: string
    Name: string
    Description?: string
    EventPattern?: string
    RoleArn?: string
    TargetArn: string
    InputEvent: string
    ScheduleExpression?: string
    State?: 'ENABLED' | 'DISABLED'
    Tags: Record<string, string>
  },
  log: Log = getLog('PUT-RULE')
): Promise<{ RuleArn: string }> => {
  const {
    Region,
    Tags,
    RoleArn,
    Description,
    EventPattern,
    Name,
    TargetArn,
    InputEvent,
    ScheduleExpression,
    State = 'ENABLED'
  } = params

  const eventBridge = new EventBridge({ region: Region })

  log.debug(`Put the rule "${Name}"`)

  const put = retry(eventBridge, eventBridge.putRule, Options.Defaults.override({ log }))
  const putTargets = retry(eventBridge, eventBridge.putTargets, Options.Defaults.override({ log }))

  const { RuleArn } = await put({
    Name,
    Description,
    EventPattern,
    RoleArn,
    ScheduleExpression,
    State,
    Tags: Object.entries(Tags).map(([Key, Value]) => ({ Key, Value }))
  })

  if (RuleArn == null) {
    throw new Error(`Failed to put rule ${Name}`)
  }

  log.debug(`The rule "${Name}" has been put`)

  const Id = uuidV4()

  await putTargets({
    Rule: Name,
    Targets: [
      {
        Id,
        Arn: TargetArn,
        Input: InputEvent,
        RoleArn
      }
    ]
  })

  await addFunctionPermission({
    Region,
    FunctionName: TargetArn,
    Action: 'lambda:InvokeFunction',
    Principal: 'events.amazonaws.com',
    SourceArn: RuleArn,
    StatementId: Id
  })

  return { RuleArn }
}

export default putRule
