import CloudWatchLogs, { LogStreams } from 'aws-sdk/clients/cloudwatchlogs'

import { getLog, Log, Options, retry } from '../utils'

const describeLogStreams = async (
  params: {
    Region: string
    LogGroupName: string
    Limit?: number
  },
  log: Log = getLog('DESCRIBE-LOG-STREAMS')
): Promise<LogStreams | null> => {
  const { Region, LogGroupName, Limit } = params

  const cloudwatchLogs = new CloudWatchLogs({ region: Region })

  const describeLogStreamsExecutor = retry(
    cloudwatchLogs,
    cloudwatchLogs.describeLogStreams,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Describe the log streams by "${LogGroupName}"`)

    const result = await describeLogStreamsExecutor({
      logGroupName: LogGroupName,
      limit: Limit,
      descending: true,
      orderBy: 'LastEventTime'
    })

    return result.logStreams ?? null
  } catch (error) {
    log.debug(`Failed to get describe the log streams by "${LogGroupName}"`)
    throw error
  }
}

export default describeLogStreams
