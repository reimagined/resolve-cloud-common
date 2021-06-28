import CloudWatch, {
  ComparisonOperator as ComparisonOperatorType,
  Statistic as StatisticType
} from 'aws-sdk/clients/cloudwatch'

import { Log, getLog, retry } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      AlarmName: string
      AlarmDescription: string
      Namespace: string
      MetricName: string
      Dimensions: Array<{ Name: string; Value: string }>
      EvaluationPeriods: number
      ComparisonOperator: ComparisonOperatorType
      Threshold: number
      AlarmActions: Array<string>
      Statistic: StatisticType
      Tags: Array<{ Key: string; Value: string }>
    },
    log?: Log
  ): Promise<void>
}

const putMetricAlarm: TMethod = async (
  {
    Region,
    AlarmName,
    AlarmDescription,
    Namespace,
    MetricName,
    Dimensions,
    EvaluationPeriods,
    ComparisonOperator,
    Threshold,
    AlarmActions,
    Statistic,
    Tags
  },
  log = getLog('PUT-METRIC-ALARM')
) => {
  const cw = new CloudWatch({ region: Region })
  const putAlarm = retry(cw, cw.putMetricAlarm)

  log.verbose(`Creating alarm by metric`)

  try {
    await putAlarm({
      AlarmName,
      AlarmDescription,
      Namespace,
      Dimensions,
      MetricName,
      EvaluationPeriods,
      ComparisonOperator,
      Threshold,
      AlarmActions,
      Statistic,
      Tags
    })

    log.verbose(`Alarm created`)
  } catch (error) {
    log.verbose(`Alarm creating failed`)
    throw error
  }
}

export default putMetricAlarm
