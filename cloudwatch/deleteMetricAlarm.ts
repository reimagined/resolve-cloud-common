import CloudWatch from 'aws-sdk/clients/cloudwatch'

import { Log, getLog, retry } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      AlarmName: string
    },
    log?: Log
  ): Promise<void>
}

const deleteMetricAlarm: TMethod = async (
  { Region, AlarmName },
  log = getLog('DELETE-METRIC-ALARM')
) => {
  const cw = new CloudWatch({ region: Region })
  const deleteAlarm = retry(cw, cw.deleteAlarms)

  log.verbose(`Deleting "${AlarmName}" alarm`)

  try {
    await deleteAlarm({
      AlarmNames: [AlarmName]
    })

    log.verbose(`Alarm deleted`)
  } catch (error) {
    log.verbose(`Alarm deleting failed`)
    throw error
  }
}

export default deleteMetricAlarm
