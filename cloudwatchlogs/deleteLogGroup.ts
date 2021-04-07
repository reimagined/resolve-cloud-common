import CloudWatchLogs from 'aws-sdk/clients/cloudwatchlogs'

import { getLog, Log, Options, retry, ignoreNotFoundException } from '../utils'

const deleteLogGroup = async (
  params: {
    Region: string
    LogGroupName: string
  },
  log: Log = getLog('DELETE-LOG-GROUP')
): Promise<void> => {
  const { Region, LogGroupName } = params

  const cloudwatchLogs = new CloudWatchLogs({ region: Region })

  const deleteLogGroupExecutor = retry(
    cloudwatchLogs,
    cloudwatchLogs.deleteLogGroup,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Delete the log group "${LogGroupName}"`)

    await deleteLogGroupExecutor({
      logGroupName: LogGroupName
    })
  } catch (error) {
    log.debug(`Failed to delete the log group "${LogGroupName}"`)
    ignoreNotFoundException(error)
  }
}

export default deleteLogGroup
