import Route53 from 'aws-sdk/clients/route53'

import { retry, Options, Log } from '../utils'

const listRoute53Records = async (
  params: {
    HostedZoneId: string
  },
  log?: Log
): Promise<
  Array<{
    RecordName: string
    RecordType: string
    DNSName: string
  }>
> => {
  const { HostedZoneId } = params
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

  const { ResourceRecordSets: records } = await listResourceRecordSets({
    HostedZoneId,
    MaxItems: '100'
  })

  const result: Array<{
    RecordName: string
    RecordType: string
    DNSName: string
  }> = []

  for (const record of records) {
    if (record != null && record.Type && record.AliasTarget != null) {
      result.push({
        RecordType: record.Type,
        RecordName: record.Name,
        DNSName: record.AliasTarget.DNSName
      })
    }
  }

  return result
}

export default listRoute53Records
