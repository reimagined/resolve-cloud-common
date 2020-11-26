import Route53 from 'aws-sdk/clients/route53'

import listRoute53Records from './listRoute53Records'
import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteRoute53Records = async (
  params: {
    HostedZoneId: string
    AliasHostedZoneId: string
    Records: Array<{ RecordName: string; RecordType: string }>
    IfExists?: boolean
  },
  log: Log = getLog('DELETE-ROUTE-53-RECORDS')
): Promise<void> => {
  const { HostedZoneId, AliasHostedZoneId, Records, IfExists } = params

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

    const listRecords = await listRoute53Records({ HostedZoneId })

    const Changes = listRecords
      .filter(({ RecordType: foundRecordType, RecordName: foundRecordName }) =>
        Records.find(
          ({ RecordType, RecordName }) =>
            foundRecordName === RecordName && foundRecordType === RecordType
        )
      )
      .map(({ RecordType, RecordName, DNSName }) => ({
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
      }))

    if (Changes.length > 0) {
      await changeResourceRecordSets({
        HostedZoneId,
        ChangeBatch: {
          Changes
        }
      })
    }

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

export default deleteRoute53Records
