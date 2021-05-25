import EC2, { Subnet } from 'aws-sdk/clients/ec2'
import { Netmask } from 'netmask'

import describeVPCs from './describeVpcs'
import describeInternetGateways from './describeInternetGateways'
import describeNATGateways from './describeNatGateways'
import describeRouteTables from './describeRouteTables'
import describeSubnets from './describeSubnets'
import { Log, getLog, retry, Options } from '../utils'

const detectCidrBlock = (subnet: Subnet) => {
  if (subnet.CidrBlock == null) {
    throw new Error(`Failed to get IPv4 CIDR block for "${subnet.SubnetId}" subnet`)
  }
  const block = new Netmask(subnet.CidrBlock)

  return block.next(3).toString()
}

const ensureVpc = async (
  params: {
    Region: string
  },
  log: Log = getLog('ENSURE-VPC')
): Promise<void> => {
  const { Region } = params
  const ec2 = new EC2({
    region: Region
  })

  const createSubnet = retry(ec2, ec2.createSubnet, Options.Defaults.override({ log }))
  const createRoute = retry(ec2, ec2.createRoute, Options.Defaults.override({ log }))
  const createRouteTable = retry(ec2, ec2.createRouteTable, Options.Defaults.override({ log }))
  const createNatGateway = retry(ec2, ec2.createNatGateway, Options.Defaults.override({ log }))
  const allocateAddress = retry(ec2, ec2.allocateAddress, Options.Defaults.override({ log }))
  const associateAddress = retry(ec2, ec2.associateAddress, Options.Defaults.override({ log }))
  const attachInternetGateway = retry(
    ec2,
    ec2.attachInternetGateway,
    Options.Defaults.override({ log })
  )
  const createNetworkInterface = retry(
    ec2,
    ec2.createNetworkInterface,
    Options.Defaults.override({ log })
  )
  const createInternetGateway = retry(
    ec2,
    ec2.createInternetGateway,
    Options.Defaults.override({ log })
  )
  const associateRouteTable = retry(
    ec2,
    ec2.associateRouteTable,
    Options.Defaults.override({ log })
  )

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

  const privateSubnets = subnets.filter(({ DefaultForAz }) => DefaultForAz)
  let publicSubnet = subnets.find(({ DefaultForAz }) => !DefaultForAz)

  if (publicSubnet == null) {
    log.debug('Create public subnet')
    const { Subnet: newSubnet } = await createSubnet({
      VpcId: defaultVpcId,
      CidrBlock: detectCidrBlock(subnets[0])
    })

    publicSubnet = newSubnet
  }

  const attachedInternetGateway = await describeInternetGateways({
    Region,
    Filters: [
      {
        Name: 'attachment.vpc-id',
        Values: [defaultVpcId]
      }
    ]
  })

  let internetGatewayId: string

  if (attachedInternetGateway.length === 0) {
    log.debug('Create internet gateway')
    const { InternetGateway } = await createInternetGateway({})

    if (InternetGateway == null || InternetGateway.InternetGatewayId == null) {
      throw new Error('Failed to create internet gateway')
    }

    const { InternetGatewayId } = InternetGateway

    log.debug('Attach internet gateway')

    await attachInternetGateway({
      VpcId: defaultVpcId,
      InternetGatewayId
    })

    internetGatewayId = InternetGatewayId
  } else {
    log.debug('Get existing internet gateway')

    const internetGateway = attachedInternetGateway[0]

    if (internetGateway == null || internetGateway.InternetGatewayId == null) {
      throw new Error('Failed to get internet gateway')
    }

    internetGatewayId = internetGateway.InternetGatewayId
  }

  const natGateways = await describeNATGateways({
    Region,
    Filters: [
      {
        Name: 'vpc-id',
        Values: [defaultVpcId]
      }
    ]
  })

  let natGatewayId: string

  if (natGateways.length < 1) {
    log.debug('Create elastic address')

    const elasticAddress = await allocateAddress({
      Domain: 'vpc'
    })

    if (elasticAddress == null || elasticAddress.AllocationId == null) {
      throw new Error('Failed to allocate an Elastic IP address for VPC')
    }

    if (publicSubnet == null || publicSubnet.SubnetId == null) {
      throw new Error('Failed to get public subnet')
    }

    log.debug('Create network interface')

    const { NetworkInterface } = await createNetworkInterface({
      SubnetId: publicSubnet.SubnetId
    })

    if (NetworkInterface == null) {
      throw new Error('Failed to create network interface')
    }

    log.debug('Create NAT gateway')

    const { NatGateway } = await createNatGateway({
      SubnetId: publicSubnet.SubnetId,
      AllocationId: elasticAddress.AllocationId
    })

    if (NatGateway == null || NatGateway.NatGatewayId == null) {
      throw new Error('Failed to create NAT gateway')
    }

    natGatewayId = NatGateway.NatGatewayId

    log.debug('Associate elastic address and network interface')

    await associateAddress({
      AllocationId: elasticAddress.AllocationId,
      NetworkInterfaceId: NetworkInterface.NetworkInterfaceId
    })
  } else {
    log.debug('Get existing NAT gateway')

    const natGateway = natGateways[0]

    if (natGateway == null || natGateway.NatGatewayId == null) {
      throw new Error('Failed to get NAT gateway')
    }

    natGatewayId = natGateway.NatGatewayId
  }

  const routeTables = await describeRouteTables({
    Region,
    Filters: [
      {
        Name: 'vpc-id',
        Values: [defaultVpcId]
      }
    ]
  })

  const privateRouteTable = routeTables.find(
    ({ Associations }) =>
      Associations != null && Associations.filter(({ Main }) => !Main).length === 3
  )

  const publicRouteTable = routeTables.find(
    ({ Associations }) =>
      Associations != null && Associations.filter(({ Main }) => !Main).length === 1
  )

  if (privateRouteTable == null) {
    log.debug('Create private route table')

    const mainRouteTable = routeTables.find(
      ({ Associations }) =>
        Associations != null && Associations.filter(({ Main }) => Main).length === 1
    )

    if (
      mainRouteTable == null ||
      mainRouteTable.RouteTableId == null ||
      mainRouteTable.Routes == null
    ) {
      throw new Error('Failed to get main association')
    }

    const { RouteTableId, Routes } = mainRouteTable

    const configuredRoute = Routes.find(
      ({ DestinationCidrBlock }) =>
        DestinationCidrBlock != null && DestinationCidrBlock === '0.0.0.0/0'
    )

    if (configuredRoute == null) {
      log.debug(`Add route to "${RouteTableId}" route table`)
      await createRoute({
        DestinationCidrBlock: '0.0.0.0/0',
        RouteTableId,
        NatGatewayId: natGatewayId
      })
    }

    for (const { SubnetId } of privateSubnets) {
      log.debug(`Associate "${RouteTableId}" private route table with "${SubnetId}" subnet`)
      await associateRouteTable({
        RouteTableId,
        SubnetId
      })
    }
  }

  if (publicRouteTable == null) {
    log.debug('Create public route table')

    const { RouteTable } = await createRouteTable({
      VpcId: defaultVpcId
    })

    if (RouteTable == null || RouteTable.RouteTableId == null) {
      throw new Error('Failed to create public route table')
    }

    const { RouteTableId } = RouteTable

    await createRoute({
      DestinationCidrBlock: '0.0.0.0/0',
      RouteTableId,
      GatewayId: internetGatewayId
    })

    if (publicSubnet == null || publicSubnet.SubnetId == null) {
      throw new Error('Failed to get public subnet')
    }

    log.debug(
      `Associate "${RouteTableId}" public route table with "${publicSubnet.SubnetId}" subnet`
    )

    await associateRouteTable({
      RouteTableId,
      SubnetId: publicSubnet.SubnetId
    })
  }
}

export default ensureVpc
