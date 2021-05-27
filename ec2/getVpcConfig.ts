import describeSecurityGroups from './describeSecurityGroups'
import describeVPCs from './describeVpcs'
import describeSubnets from './describeSubnets'

import { getLog, Log } from '../utils'

const getVpcConfig = async (
  params: { Region: string },
  log: Log = getLog('GET-VPC-CONFIG')
): Promise<{ SubnetIds: Array<string>; SecurityGroupIds: Array<string> }> => {
  const { Region } = params
  const defaultVpc = (
    await describeVPCs({
      Region
    })
  ).find((vpc) => vpc.IsDefault)

  if (defaultVpc == null || defaultVpc.VpcId == null) {
    throw new Error('Failed to get default VPC')
  }

  const defaultVpcId = defaultVpc.VpcId

  const subnets = await describeSubnets({
    Region,
    Filters: [
      {
        Name: 'vpc-id',
        Values: [defaultVpcId]
      }
    ]
  })

  const privateSubnets = subnets.filter(
    ({ DefaultForAz, SubnetId }) => DefaultForAz && SubnetId != null
  )

  if (privateSubnets == null || privateSubnets.length !== 3) {
    throw new Error('Failed to get private subnets')
  }

  const securityGroups = await describeSecurityGroups({
    Region,
    Filters: [
      {
        Name: 'vpc-id',
        Values: [defaultVpcId]
      }
    ]
  })

  const defaultSecurityGroup = securityGroups.find(({ GroupName }) => GroupName === 'default')

  if (defaultSecurityGroup == null || defaultSecurityGroup.GroupId == null) {
    throw new Error('Failed to get default security group')
  }

  return {
    SubnetIds: privateSubnets.map(({ SubnetId }) => SubnetId as string),
    SecurityGroupIds: [defaultSecurityGroup.GroupId]
  }
}

export default getVpcConfig
