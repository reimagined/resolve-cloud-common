import EventBridge, { Rule } from 'aws-sdk/clients/eventbridge'

import { retry, Options, getLog, Log } from '../utils'

const getRuleByTags = async (
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-RULES-BY-TAGS')
): Promise<Array<{ ResourceArn: string; Tags: Record<string, string> }>> => {
  const { Region, Tags } = params

  const eventBridge = new EventBridge({ region: Region })

  const listRules = retry(eventBridge, eventBridge.listRules, Options.Defaults.override({ log }))
  const listTagsForResource = retry(
    eventBridge,
    eventBridge.listTagsForResource,
    Options.Defaults.override({ log })
  )

  const rulesList: Array<Rule> = []
  let nextToken: string | undefined

  for (;;) {
    const { Rules, NextToken } = await listRules({
      NextToken: nextToken
    })

    if (Rules != null) {
      rulesList.push(...Rules)
    }

    nextToken = NextToken

    if (NextToken == null || Rules?.length === 0) {
      break
    }
  }

  const resources: Array<{ ResourceArn: string; Tags: Record<string, string> }> = []

  for (const { Arn } of rulesList) {
    const { Tags: ResourceTags } = await listTagsForResource({
      ResourceARN: Arn as string
    })

    if (ResourceTags != null) {
      const matchedTags = ResourceTags.reduce((acc: number, { Key, Value }) => {
        return Key != null && Value != null && Tags[Key] === Value ? acc + 1 : acc
      }, 0)

      if (matchedTags === Object.keys(Tags).length) {
        resources.push({
          ResourceArn: Arn as string,
          Tags: ResourceTags.reduce((acc, { Key, Value }) => {
            return Object.assign(acc, { [Key]: Value })
          }, {})
        })
      }
    }
  }

  return resources
}

export default getRuleByTags
