import EC2, { FilterList, SubnetList } from 'aws-sdk/clients/ec2'

import { getLog, Log, Options, retry } from '../utils'

const describeSubnets = async (
  params: { Region: string; Filters?: FilterList },
  log: Log = getLog('DESCRIBE-SUBNETS')
): Promise<SubnetList> => {
  const { Region, Filters } = params
  const ec2 = new EC2({
    region: Region
  })

  const describeSubnetsExecutor = retry(
    ec2,
    ec2.describeSubnets,
    Options.Defaults.override({ log })
  )

  const subnets: SubnetList = []

  try {
    log.debug(`List subnets`)

    let NextToken: string | undefined
    for (;;) {
      log.debug(`Get resources by NextToken = ${NextToken ?? '<none>'}`)
      const { Subnets, NextToken: Token } = await describeSubnetsExecutor({
        NextToken,
        Filters
      })

      if (Subnets == null || Subnets.length === 0) {
        break
      }

      Subnets.map((subnet) => subnets.push(subnet))

      if (Token == null || Token === '') {
        break
      }

      NextToken = Token
    }

    log.debug(`List subnets have been found`)
    return subnets
  } catch (error) {
    log.debug(`Failed to find list subnets`)
    throw error
  }
}

export default describeSubnets
