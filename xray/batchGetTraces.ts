import XRay, { TraceList } from 'aws-sdk/clients/xray'

import { retry, Options, getLog, Log } from '../utils'

const batchGetTraces = async (
  params: {
    Region: string
    TraceIds: Array<string>
  },
  log: Log = getLog('BATCH-GET-TRACES')
): Promise<TraceList> => {
  const { Region, TraceIds } = params

  const xRay = new XRay({ region: Region })

  const batchGetTracesExecutor = retry(
    xRay,
    xRay.batchGetTraces,
    Options.Defaults.override({ log })
  )

  const items: TraceList = []

  try {
    log.debug(`List traces`)

    let NextToken: string | undefined
    for (;;) {
      log.debug(`Get resources by Marker = ${NextToken ?? '<none>'}`)
      const { Traces, NextToken: FollowingNextToken } = await batchGetTracesExecutor({
        TraceIds,
        NextToken
      })

      if (Traces != null) {
        Traces.map((trace) => items.push(trace))
      }

      if (
        Traces == null ||
        Traces.length === 0 ||
        FollowingNextToken == null ||
        FollowingNextToken === ''
      ) {
        break
      }

      NextToken = FollowingNextToken
    }
  } catch (error) {
    log.debug(`Failed to get traces`)
    throw error
  }

  return items
}

export default batchGetTraces
