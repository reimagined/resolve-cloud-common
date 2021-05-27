import EC2, { FilterList, RouteTableList } from 'aws-sdk/clients/ec2'

import { getLog, Log, Options, retry } from '../utils'

const describeRouteTables = async (
  params: { Region: string; Filters?: FilterList },
  log: Log = getLog('DESCRIBE-ROUTE-TABLES')
): Promise<RouteTableList> => {
  const { Region, Filters } = params
  const ec2 = new EC2({
    region: Region
  })

  const describeRouteTablesExecutor = retry(
    ec2,
    ec2.describeRouteTables,
    Options.Defaults.override({ log })
  )

  const routeTables: RouteTableList = []

  try {
    log.debug(`List route tables`)

    let NextToken: string | undefined
    for (;;) {
      log.debug(`Get resources by NextToken = ${NextToken ?? '<none>'}`)
      const { RouteTables, NextToken: Token } = await describeRouteTablesExecutor({
        NextToken,
        Filters
      })

      if (RouteTables == null || RouteTables.length === 0) {
        break
      }

      routeTables.push(...RouteTables)

      if (Token == null || Token === '') {
        break
      }

      NextToken = Token
    }

    log.debug(`List route tables have been found`)
    return routeTables
  } catch (error) {
    log.debug(`Failed to find list route tables`)
    throw error
  }
}

export default describeRouteTables
