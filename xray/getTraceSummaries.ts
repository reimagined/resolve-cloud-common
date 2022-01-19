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

  let items: TraceSummaryList = []
  let TraceSummaries: TraceSummaryList | undefined = []

  try {
    log.debug(`List trace summaries`)

    let NextToken: string | undefined

    do {
      log.debug(`Get resources by Marker = ${NextToken ?? '<none>'}`)

      void ({ TraceSummaries, NextToken } = await getTraceSummariesExecutor({
        StartTime,
        EndTime,
        FilterExpression,
        TimeRangeType: 'TraceId',
        NextToken
      }))

      if (TraceSummaries != null) {
        items = items.concat(TraceSummaries)
      }
    } while (NextToken)
  } catch (error) {
    log.debug(`Failed to get trace summaries`)
    throw error
  }

  return items
}

export default getTraceSummaries
