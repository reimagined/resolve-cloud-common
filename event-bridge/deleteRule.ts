import EventBridge, { TargetList } from 'aws-sdk/clients/eventbridge'

import { retry, Options, getLog, Log } from '../utils'

const deleteRule = async (
  params: {
    Region: string
    Name: string
    EventBusName?: string
  },
  log: Log = getLog('DELETE-RULE')
): Promise<void> => {
  const { Region, EventBusName, Name } = params

  const eventBridge = new EventBridge({ region: Region })

  const listTargetsByRule = retry(
    eventBridge,
    eventBridge.listTargetsByRule,
    Options.Defaults.override({ log })
  )

  const removeTargets = retry(
    eventBridge,
    eventBridge.removeTargets,
    Options.Defaults.override({ log })
  )

  const deleteRuleExecutor = retry(
    eventBridge,
    eventBridge.deleteRule,
    Options.Defaults.override({ log })
  )

  const targetList: TargetList = []
  let nextToken: string | undefined

  log.debug(`List targets by rule "${Name}"`)

  for (;;) {
    const { Targets, NextToken } = await listTargetsByRule({
      Rule: Name,
      NextToken: nextToken
    })

    if (Targets != null) {
      targetList.push(...Targets)
    }

    nextToken = NextToken

    if (NextToken == null || Targets?.length === 0) {
      break
    }
  }

  log.debug(`Remove ${targetList.length} targets by rule`)

  await removeTargets({
    Rule: Name,
    Ids: targetList.map(({ Id }) => Id)
  })

  log.debug(`Delete the rule "${Name}"`)

  await deleteRuleExecutor({
    Name,
    EventBusName
  })

  log.debug(`The rule "${Name}" has been deleted`)
}

export default deleteRule
