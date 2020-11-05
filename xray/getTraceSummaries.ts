import XRay, { TraceSummaryList } from 'aws-sdk/clients/xray'

import { retry, Options, getLog, Log } from '../utils'

const getTraceSummaries = async (
  params: {
    Region: string
    StartTime: Date
    EndTime: Date
    FilterExpression: string
  },
  log: Log = getLog('GET-TRACE-SUMMARIES')
): Promise<TraceSummaryList> => {
  const { Region, StartTime, EndTime, FilterExpression } = params

  const xRay = new XRay({ region: Region })

  const getTraceSummariesExecutor = retry(
    xRay,
    xRay.getTraceSummaries,
    Options.Defaults.override({ log })
  )

  const items: TraceSummaryList = []

  try {
    log.debug(`List trace summaries`)

    let NextToken: string | undefined
    for (;;) {
      log.debug(`Get resources by Marker = ${NextToken ?? '<none>'}`)
      const { TraceSummaries, NextToken: FollowingNextToken } = await getTraceSummariesExecutor({
        StartTime,
        EndTime,
        FilterExpression
      })

      if (TraceSummaries != null) {
        TraceSummaries.map((summary) => items.push(summary))
      }

      if (
        TraceSummaries == null ||
        TraceSummaries.length === 0 ||
        FollowingNextToken == null ||
        FollowingNextToken === ''
      ) {
        break
      }

      NextToken = FollowingNextToken
    }
  } catch (error) {
    log.debug(`Failed to get trace summaries`)
    throw error
  }

  return items
}

export default getTraceSummaries
