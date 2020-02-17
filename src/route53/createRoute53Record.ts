import Route53 from 'aws-sdk/clients/route53'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      HostedZoneId: string
      AliasHostedZoneId: string
      RecordName: string
      RecordType: string
      DNSName: string
    },
    log?: Log
  ): Promise<void>
}

const createRoute53Record: TMethod = async (
  { HostedZoneId, AliasHostedZoneId, RecordName, RecordType, DNSName },
  log = getLog('CREATE-ROUTE-53-RECORD')
) => {
  const route53 = new Route53()

  try {
    log.debug(`Change resource record sets for "${HostedZoneId}" zone id`)

    const changeResourceRecordSets = retry(
      route53,
      route53.changeResourceRecordSets,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000
      })
    )

    await changeResourceRecordSets({
      HostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: 'CREATE',
            ResourceRecordSet: {
              AliasTarget: {
                DNSName,
                EvaluateTargetHealth: false,
                HostedZoneId: AliasHostedZoneId
              },
              Name: RecordName,
              Type: RecordType
            }
          }
        ]
      }
    })

    log.debug('Change resource record sets')
  } catch (error) {
    log.error('Resource record sets change failed')
    throw error
  }
}

export default createRoute53Record
