const Route53 = require('aws-sdk/clients/route53')

const { retry, Options } = require('../utils')

const createRoute53Record = async ({
  HostedZoneId,
  AliasHostedZoneId,
  RecordName,
  RecordType,
  DNSName
}) => {
  const route53 = new Route53()

  const changeResourceRecordSets = retry(route53, route53.changeResourceRecordSets, Options.Defaults.override({
    maxAttempts: 5,
    delay: 1000
  }))

  return changeResourceRecordSets({
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
}

module.exports = createRoute53Record
