import Route53 from 'aws-sdk/clients/route53'

import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteRoute53Record = async (
  params: {
    HostedZoneId: string
    AliasHostedZoneId: string
    RecordName: string
    RecordType: string
    DNSName: string
    IfExists?: boolean
  },
  log: Log = getLog('DELETE-ROUTE-53-RECORD')
): Promise<void> => {
  const { HostedZoneId, AliasHostedZoneId, RecordName, RecordType, DNSName, IfExists } = params

  const route53 = new Route53()

  const changeResourceRecordSets = retry(
    route53,
    route53.changeResourceRecordSets,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000,
      expectedErrors: ['InvalidChangeBatch']
    })
  )

  try {
    log.debug(`Change resource record sets for "${HostedZoneId}" zone id`)

    await changeResourceRecordSets({
      HostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: 'DELETE',
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
    if (IfExists) {
      log.debug('Skip delete route53 record')
      ignoreNotFoundException(error)
    } else {
      log.error('Resource record sets change failed')
      throw error
    }
  }
}

export default deleteRoute53Record
