import CloudWatch, {
  Dimensions as DimensionsType,
  Metrics as MetricsType
} from 'aws-sdk/clients/cloudwatch'

import { getLog, Log, Options, retry } from '../utils'

export const listMetrics = async (
  params: {
    Region: string
    Namespace?: string
    MetricName?: string
    Dimensions?: DimensionsType
  },
  log: Log = getLog('LIST-METRICS')
): Promise<MetricsType> => {
  const { Region, Namespace, MetricName, Dimensions } = params

  const cw = new CloudWatch({ region: Region })

  const listMetricsExecutor = retry(cw, cw.listMetrics, Options.Defaults.override({ log }))

  const metrics = []
  let nextToken: string | undefined

  try {
    for (;;) {
      const { Metrics, NextToken } = await listMetricsExecutor({
        Namespace,
        MetricName,
        Dimensions,
        NextToken: nextToken
      })

      nextToken = NextToken

      if (Metrics != null) {
        metrics.push(...Metrics)
      }

      if (Metrics == null || Metrics.length === 0 || nextToken == null || nextToken === '') {
        break
      }
    }

    return metrics
  } catch (e) {
    log.error(e)
    throw e
  }
}

export default listMetrics
