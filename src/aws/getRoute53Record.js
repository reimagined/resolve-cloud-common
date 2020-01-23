const Route53 = require('aws-sdk/clients/route53')

const { retry, Options } = require('../utils')

const getRoute53Record = async ({ HostedZoneId, RecordName, RecordType }) => {
  const route53 = new Route53()

  const listResourceRecordSets = retry(route53, route53.listResourceRecordSets, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  const { ResourceRecordSets: records } = await listResourceRecordSets({
    HostedZoneId,
    MaxItems: '1',
    StartRecordName: RecordName,
    StartRecordType: RecordType
  })

  if (records != null && records.length > 0 && records[0].Type === RecordType) {
    return records[0]
  }

  return null
}

module.exports = getRoute53Record
