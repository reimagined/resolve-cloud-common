import EC2, { FilterList, InternetGatewayList } from 'aws-sdk/clients/ec2'

import { getLog, Log, Options, retry } from '../utils'

const describeInternetGateways = async (
  params: { Region: string; Filters?: FilterList },
  log: Log = getLog('DESCRIBE-INTERNET-GATEWAYS')
): Promise<InternetGatewayList> => {
  const { Region, Filters } = params
  const ec2 = new EC2({
    region: Region
  })

  const describeInternetGatewaysExecutor = retry(
    ec2,
    ec2.describeInternetGateways,
    Options.Defaults.override({ log })
  )

  const internetGateways: InternetGatewayList = []

  try {
    log.debug(`List internet gateways`)

    let NextToken: string | undefined
    for (;;) {
      log.debug(`Get resources by NextToken = ${NextToken ?? '<none>'}`)
      const { InternetGateways, NextToken: Token } = await describeInternetGatewaysExecutor({
        NextToken,
        Filters
      })

      if (InternetGateways == null || InternetGateways.length === 0) {
        break
      }

      InternetGateways.map((internetGateway) => internetGateways.push(internetGateway))

      if (Token == null || Token === '') {
        break
      }

      NextToken = Token
    }

    log.debug(`List internet gateways have been found`)
    return internetGateways
  } catch (error) {
    log.debug(`Failed to find list internet gateways`)
    throw error
  }
}

export default describeInternetGateways
