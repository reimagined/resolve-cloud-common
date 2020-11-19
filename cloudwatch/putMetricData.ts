import CloudWatch from 'aws-sdk/clients/cloudwatch'

import { getLog, Log, Options, retry } from '../utils'

const MAX_METRICS_DIMENSION_VALUE_LENGTH = 256

const trimString = (input: string, maxLength: number): string => {
  const trimmedStringEnd = '...'

  return input.length > maxLength
    ? `${input.slice(
        0,
        MAX_METRICS_DIMENSION_VALUE_LENGTH - trimmedStringEnd.length
      )}${trimmedStringEnd}`
    : input
}

export const putMetricData = async (
  params: {
    Message: string
    Resource: string
    MetricName: 'Errors' | 'Warnings'
  },
  log: Log = getLog('PUT-METRIC-DATA')
): Promise<void> => {
  const cw = new CloudWatch()

  try {
    const now = new Date()
    const message = trimString(params.Message, MAX_METRICS_DIMENSION_VALUE_LENGTH)
    const putMetrics = retry(cw, cw.putMetricData, Options.Defaults.override({ log }))

    await putMetrics({
      Namespace: 'RESOLVE_CLOUD_METRICS',
      MetricData: [
        {
          MetricName: params.MetricName,
          Timestamp: now,
          Unit: 'Count',
          Value: 1,
          Dimensions: [
            {
              Name: 'Resource',
              Value: params.Resource
            },
            {
              Name: 'Message',
              Value: message
            }
          ]
        },
        {
          MetricName: params.MetricName,
          Timestamp: now,
          Unit: 'Count',
          Value: 1,
          Dimensions: [
            {
              Name: 'Resource',
              Value: params.Resource
            }
          ]
        },
        {
          MetricName: params.MetricName,
          Timestamp: now,
          Unit: 'Count',
          Value: 1
        }
      ]
    })
  } catch (e) {
    log.error(e)
    throw e
  }
}

export default putMetricData
