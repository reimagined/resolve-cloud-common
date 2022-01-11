import CloudWatch, {
  MetricDataQueries as MetricDataQueriesType,
  Timestamp,
  MetricDataResults as MetricDataResultsType
} from 'aws-sdk/clients/cloudwatch'

import { Log, getLog, retry } from '../utils'

const getMetricData = async (
  {
    Region,
    MetricDataQueries,
    StartTime,
    EndTime
  }: {
    Region: string
    MetricDataQueries: MetricDataQueriesType
    StartTime: Timestamp
    EndTime: Timestamp
  },
  log: Log = getLog('DELETE-METRIC-ALARM')
): Promise<{ MetricDataResults: MetricDataResultsType }> => {
  const cw = new CloudWatch({ region: Region })
  const getMetricDataExecutor = retry(cw, cw.getMetricData)

  log.verbose(`Getting metric data`)

  try {
    const { MetricDataResults } = await getMetricDataExecutor({
      MetricDataQueries,
      StartTime,
      EndTime
    })

    if (MetricDataResults == null) {
      throw new Error('Metrc data results does not exist')
    }

    log.verbose(`Metric data got`)

    return { MetricDataResults }
  } catch (error) {
    log.verbose(`Metric data getting failed`)
    throw error
  }
}

export default getMetricData
