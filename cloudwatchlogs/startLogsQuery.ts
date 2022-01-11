import CloudWatchLogs from 'aws-sdk/clients/cloudwatchlogs'

import { getLog, Log, Options, retry } from '../utils'

const startLogsQuery = async (
  params: {
    Region: string
    LogGroupName: string
    StartTime: number
    EndTime: number
    QueryString: string
    Limit?: number
  },
  log: Log = getLog('START-LOGS-QUERY')
): Promise<string | null> => {
  const { Region, LogGroupName, Limit, QueryString, StartTime, EndTime } = params

  const cloudwatchLogs = new CloudWatchLogs({ region: Region })

  const startQueryExecutor = retry(
    cloudwatchLogs,
    cloudwatchLogs.startQuery,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Start query for "${LogGroupName}" log group`)

    const { queryId } = await startQueryExecutor({
      logGroupName: LogGroupName,
      limit: Limit,
      queryString: QueryString,
      startTime: StartTime,
      endTime: EndTime
    })

    return queryId ?? null
  } catch (error) {
    log.debug(`Failed to start query`)
    throw error
  }
}

export default startLogsQuery
