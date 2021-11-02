import CloudWatch, { PutMetricDataInput } from 'aws-sdk/clients/cloudwatch'

import { getLog, Log, Options, retry } from '../utils'

export const putMetricData = async (
  params: PutMetricDataInput,
  log: Log = getLog('PUT-METRIC-DATA')
): Promise<void> => {
  const { Namespace, MetricData } = params

  const cw = new CloudWatch()

  try {
    const putMetrics = retry(cw, cw.putMetricData, Options.Defaults.override({ log }))

    await putMetrics({
      Namespace,
      MetricData
    })
  } catch (e) {
    log.error(e)
    throw e
  }
}

export default putMetricData
