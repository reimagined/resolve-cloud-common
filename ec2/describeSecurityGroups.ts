import EC2, { FilterList, SecurityGroupList } from 'aws-sdk/clients/ec2'

import { getLog, Log, Options, retry } from '../utils'

const describeSecurityGroups = async (
  params: { Region: string; Filters?: FilterList },
  log: Log = getLog('DESCRIBE-SECURITY-GROUPS')
): Promise<SecurityGroupList> => {
  const { Region, Filters } = params
  const ec2 = new EC2({
    region: Region
  })

  const describeSecurityGroupsExecutor = retry(
    ec2,
    ec2.describeSecurityGroups,
    Options.Defaults.override({ log })
  )

  const securityGroups: SecurityGroupList = []

  try {
    log.debug(`List security groups`)

    let NextToken: string | undefined
    for (;;) {
      log.debug(`Get resources by NextToken = ${NextToken ?? '<none>'}`)
      const { SecurityGroups, NextToken: Token } = await describeSecurityGroupsExecutor({
        NextToken,
        Filters
      })

      if (SecurityGroups == null || SecurityGroups.length === 0) {
        break
      }

      SecurityGroups.map((securityGroup) => securityGroups.push(securityGroup))

      if (Token == null || Token === '') {
        break
      }

      NextToken = Token
    }

    log.debug(`List security groups have been found`)
    return securityGroups
  } catch (error) {
    log.debug(`Failed to find list security groups`)
    throw error
  }
}

export default describeSecurityGroups
