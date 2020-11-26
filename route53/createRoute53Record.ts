import Route53 from 'aws-sdk/clients/route53'

import { retry, Options, getLog, Log, isAlreadyExistsException } from '../utils'

const createRoute53Record = async (
  params: {
    HostedZoneId: string
    AliasHostedZoneId: string
    RecordName: string
    RecordType: string
    DNSName: string
    IfNotExists?: boolean
  },
  log: Log = getLog('CREATE-ROUTE-53-RECORD')
): Promise<void> => {
  const { HostedZoneId, AliasHostedZoneId, RecordName, RecordType, DNSName, IfNotExists } = params

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
    if (!IfNotExists || !isAlreadyExistsException(error)) {
      log.error('Resource record sets change failed')
      throw error
    }
  }
}

export default createRoute53Record
