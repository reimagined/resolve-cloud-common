import CloudWatch from 'aws-sdk/clients/cloudwatch'

import { Log, getLog, retry } from '../utils'

const deleteMetricAlarm = async (
  {
    Region,
    AlarmName
  }: {
    Region: string
    AlarmName: string
  },
  log: Log = getLog('DELETE-METRIC-ALARM')
): Promise<void> => {
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
