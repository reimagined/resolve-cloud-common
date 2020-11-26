import Route53 from 'aws-sdk/clients/route53'

import { retry, Options, getLog, Log } from '../utils'

const ensureRoute53Records = async (
  params: {
    HostedZoneId: string
    AliasHostedZoneId: string
    Records: Array<{ RecordName: string; RecordType: string; DNSName: string }>
  },
  log: Log = getLog('ENSURE-ROUTE-53-RECORDS')
): Promise<void> => {
  const { HostedZoneId, AliasHostedZoneId, Records } = params

  const route53 = new Route53()

  const changeResourceRecordSets = retry(
    route53,
    route53.changeResourceRecordSets,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000
    })
  )

  try {
    log.debug(`Change resource record sets for "${HostedZoneId}" zone id`)

    await changeResourceRecordSets({
      HostedZoneId,
      ChangeBatch: {
        Changes: Records.map(({ DNSName, RecordName, RecordType }) => ({
          Action: 'UPSERT',
          ResourceRecordSet: {
            AliasTarget: {
              DNSName,
              EvaluateTargetHealth: false,
              HostedZoneId: AliasHostedZoneId
            },
            Name: RecordName,
            Type: RecordType
          }
        }))
      }
    })

    log.debug('Change resource record sets')
  } catch (error) {
    log.error('Resource record sets change failed')
    throw error
  }
}

export default ensureRoute53Records
