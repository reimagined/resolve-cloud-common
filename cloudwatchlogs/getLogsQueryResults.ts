import CloudWatchLogs, { GetQueryResultsResponse } from 'aws-sdk/clients/cloudwatchlogs'

import { getLog, Log, Options, retry } from '../utils'

const getLogsQueryResults = async (
  params: {
    Region: string
    QueryId: string
  },
  log: Log = getLog('START-LOGS-QUERY')
): Promise<GetQueryResultsResponse> => {
  const { Region, QueryId } = params

  const cloudwatchLogs = new CloudWatchLogs({ region: Region })

  const getQueryResultsExecutor = retry(
    cloudwatchLogs,
    cloudwatchLogs.getQueryResults,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Getting query results for "${QueryId}" query`)

    return await getQueryResultsExecutor({
      queryId: QueryId
    })
  } catch (error) {
    log.debug(`Failed to get query results`)
    throw error
  }
}

export default getLogsQueryResults
