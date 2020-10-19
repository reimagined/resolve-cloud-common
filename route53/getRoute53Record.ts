import Route53 from 'aws-sdk/clients/route53'

import { retry, Options, Log } from '../utils'

const getRoute53Record = async (
  params: {
    HostedZoneId: string
    RecordName: string
    RecordType: string
  },
  log?: Log
): Promise<{ RecordName: string; RecordType: string; DNSName: string } | null> => {
  const { HostedZoneId, RecordName, RecordType } = params
  void log
  const route53 = new Route53()

  const listResourceRecordSets = retry(
    route53,
    route53.listResourceRecordSets,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000
    })
  )

  const {
    ResourceRecordSets: [record]
  } = await listResourceRecordSets({
    HostedZoneId,
    MaxItems: '1',
    StartRecordName: RecordName,
    StartRecordType: RecordType
  })

  if (record != null && record.Type === RecordType && record.AliasTarget != null) {
    return {
      RecordName,
      RecordType,
      DNSName: record.AliasTarget.DNSName
    }
  }

  return null
}

export default getRoute53Record
