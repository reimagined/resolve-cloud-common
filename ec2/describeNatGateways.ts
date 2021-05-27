import EC2, { FilterList, NatGatewayList } from 'aws-sdk/clients/ec2'

import { getLog, Log, Options, retry } from '../utils'

const describeNATGateways = async (
  params: { Region: string; Filters?: FilterList },
  log: Log = getLog('DESCRIBE-NAT-GATEWAYS')
): Promise<NatGatewayList> => {
  const { Region, Filters } = params
  const ec2 = new EC2({
    region: Region
  })

  const describeNatGateways = retry(
    ec2,
    ec2.describeNatGateways,
    Options.Defaults.override({ log })
  )

  const natGateways: NatGatewayList = []

  try {
    log.debug(`List NAT gateways`)

    let NextToken: string | undefined
    for (;;) {
      log.debug(`Get resources by NextToken = ${NextToken ?? '<none>'}`)
      const { NatGateways, NextToken: Token } = await describeNatGateways({
        NextToken,
        Filter: Filters
      })

      if (NatGateways == null || NatGateways.length === 0) {
        break
      }

      natGateways.push(...NatGateways)

      if (Token == null || Token === '') {
        break
      }

      NextToken = Token
    }

    log.debug(`List NAT gateways have been found`)
    return natGateways
  } catch (error) {
    log.debug(`Failed to find list NAT gateways`)
    throw error
  }
}

export default describeNATGateways
