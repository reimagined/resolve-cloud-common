import CloudWatchLogs, { LogStreamName, FilteredLogEvents } from 'aws-sdk/clients/cloudwatchlogs'

import { getLog, Log, Options, retry } from '../utils'

const filterLogEvents = async (
  params: {
    Region: string
    LogGroupName: string
    StartTime?: number
    EndTime?: number
    FilterPattern: string
    LogStreamNames?: Array<LogStreamName>
  },
  log: Log = getLog('FILTER-LOG-EVENTS')
): Promise<FilteredLogEvents | null> => {
  const { Region, LogGroupName, StartTime, EndTime, FilterPattern, LogStreamNames } = params

  const cloudwatchLogs = new CloudWatchLogs({ region: Region })

  const filterLogEventsExecutor = retry(
    cloudwatchLogs,
    cloudwatchLogs.filterLogEvents,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Filter log events for "${LogGroupName}"`)

    const result = await filterLogEventsExecutor({
      logGroupName: LogGroupName,
      logStreamNames: LogStreamNames,
      startTime: StartTime,
      endTime: EndTime,
      interleaved: false,
      filterPattern: FilterPattern
    })

    return result.events ?? null
  } catch (error) {
    log.debug(`Failed to get filtered log events for "${LogGroupName}"`)
    throw error
  }
}

export default filterLogEvents
