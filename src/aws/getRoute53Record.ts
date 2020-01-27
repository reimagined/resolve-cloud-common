import Route53 from 'aws-sdk/clients/route53'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      HostedZoneId: string,
      RecordName: string,
      RecordType: string
    },
    log?: Log
  ): Promise<{ DNSName: string } | null>
}

const getRoute53Record: TMethod = async ({ HostedZoneId, RecordName, RecordType }, log = getLog('GET-ROUTE-53-RECORD')) => {
  const route53 = new Route53()

  const listResourceRecordSets = retry(route53, route53.listResourceRecordSets, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  const { ResourceRecordSets: [record] } = await listResourceRecordSets({
    HostedZoneId,
    MaxItems: '1',
    StartRecordName: RecordName,
    StartRecordType: RecordType
  })

  if (record != null && record.Type === RecordType && record.AliasTarget != null) {
    return {
      DNSName: record.AliasTarget.DNSName
    }
  }

  return null
}

export default getRoute53Record
