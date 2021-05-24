import EC2, { VpcList, FilterList } from 'aws-sdk/clients/ec2'

import { getLog, Log, Options, retry } from '../utils'

const describeVPCs = async (
  params: { Region: string; Filters?: FilterList },
  log: Log = getLog('DESCRIBE-VPCS')
): Promise<VpcList> => {
  const { Region, Filters } = params
  const ec2 = new EC2({
    region: Region
  })

  const describeVpcsExecutor = retry(ec2, ec2.describeVpcs, Options.Defaults.override({ log }))

  const vpcs: VpcList = []

  try {
    log.debug(`List VPCs`)

    let NextToken: string | undefined
    for (;;) {
      log.debug(`Get resources by NextToken = ${NextToken ?? '<none>'}`)
      const { Vpcs, NextToken: Token } = await describeVpcsExecutor({
        NextToken,
        Filters
      })

      if (Vpcs == null || Vpcs.length === 0) {
        break
      }

      Vpcs.map((vpc) => vpcs.push(vpc))

      if (Token == null || Token === '') {
        break
      }

      NextToken = Token
    }

    log.debug(`List VPCs have been found`)
    return vpcs
  } catch (error) {
    log.debug(`Failed to find list VPCs`)
    throw error
  }
}

export default describeVPCs
