import CloudWatch from 'aws-sdk/clients/cloudwatch'

import { getLog, Log, Options, retry } from '../utils'

const CURRENT_METRIC_ID = 'current_metric_id'

const getOneMetricSummaryData = async (
  params: {
    Region: string
    StartTime: number
    EndTime: number
    Dimensions: Map<string, string>
    MetricName: string
    Namespace: string
    Period: number
  },
  log: Log = getLog('GET-ONE-METRIC-DATA')
): Promise<Map<number, number> | null> => {
  const { Region, StartTime, EndTime, Dimensions, MetricName, Namespace, Period } = params
  const cw = new CloudWatch({ region: Region })

  try {
    const getMetrics = retry(cw, cw.getMetricData, Options.Defaults.override({ log }))
    let NextToken: string | undefined
    const result = new Map<number, number>()

    do {
      const { MetricDataResults, NextToken: CurrentNextToken } = await getMetrics({
        ScanBy: 'TimestampAscending',
        StartTime: new Date(StartTime),
        EndTime: new Date(EndTime),
        MetricDataQueries: [
          {
            Id: CURRENT_METRIC_ID,
            MetricStat: {
              Metric: {
                Dimensions: [...Dimensions.entries()].map(([Name, Value]) => ({ Name, Value })),
                MetricName,
                Namespace
              },
              Stat: 'Sum',
              Period
            },
            ReturnData: true
          }
        ],
        NextToken
      })

      const { Timestamps = [], Values = [] } = (MetricDataResults ?? []).find(
        (e) => e.Id === CURRENT_METRIC_ID
      ) ?? { Timestamps: [], Values: [] }

      if (Timestamps.length === 0) {
        break
      }

      for (let index = 0; index < Timestamps.length; index++) {
        result.set(Timestamps[index].valueOf(), Values[index])
      }

      NextToken = CurrentNextToken
    } while (NextToken != null)

    if (result.size > 0) {
      return result
    } else {
      return null
    }
  } catch (e) {
    log.error(e)
    throw e
  }
}

export default getOneMetricSummaryData
