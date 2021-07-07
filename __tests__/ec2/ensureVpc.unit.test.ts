import EC2 from 'aws-sdk/clients/ec2'
import { mocked } from 'ts-jest/utils'

import { mockedSdkFunction } from '../mockedSdkFunction'

import ensureVpc from '../../ec2/ensureVpc'
import describeVPCs from '../../ec2/describeVpcs'
import describeInternetGateways from '../../ec2/describeInternetGateways'
import describeNATGateways from '../../ec2/describeNatGateways'
import describeRouteTables from '../../ec2/describeRouteTables'
import describeSubnets from '../../ec2/describeSubnets'

jest.mock('../../utils')

jest.mock('../../ec2/describeVpcs', () => jest.fn())
jest.mock('../../ec2/describeInternetGateways', () => jest.fn())
jest.mock('../../ec2/describeNatGateways', () => jest.fn())
jest.mock('../../ec2/describeRouteTables', () => jest.fn())
jest.mock('../../ec2/describeSubnets', () => jest.fn())

const mockCreateSubnet = mockedSdkFunction(EC2.prototype.createSubnet)
const mockDeleteRoute = mockedSdkFunction(EC2.prototype.deleteRoute)
const mockCreateRoute = mockedSdkFunction(EC2.prototype.createRoute)
const mockCreateRouteTable = mockedSdkFunction(EC2.prototype.createRouteTable)
const mockCreateNatGateway = mockedSdkFunction(EC2.prototype.createNatGateway)
const mockAllocateAddress = mockedSdkFunction(EC2.prototype.allocateAddress)
const mockAssociateRouteTable = mockedSdkFunction(EC2.prototype.associateRouteTable)

const mockDescribeVPCs = mocked(describeVPCs)
const mockDescribeSubnets = mocked(describeSubnets)
const mockDescribeInternetGateways = mocked(describeInternetGateways)
const mockDescribeNATGateways = mocked(describeNATGateways)
const mockDescribeRouteTables = mocked(describeRouteTables)

describe('ensureVpc', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should VPC has been ensure with tags', async () => {
    mockDescribeVPCs.mockResolvedValueOnce([
      {
        VpcId: 'default-vpc-id',
        IsDefault: true
      }
    ])
    mockDescribeSubnets.mockResolvedValueOnce([
      { DefaultForAz: true, CidrBlock: '172.31.0.0/20' },
      { DefaultForAz: true, CidrBlock: '172.31.16.0/20' },
      { DefaultForAz: true, CidrBlock: '172.31.32.0/20' }
    ])
    mockCreateSubnet.mockResolvedValueOnce({
      Subnet: {
        SubnetId: 'public-subnet-id'
      }
    })
    mockDescribeInternetGateways.mockResolvedValueOnce([{ InternetGatewayId: 'igw-id' }])
    mockDescribeNATGateways.mockResolvedValueOnce([])
    mockAllocateAddress.mockResolvedValueOnce({ AllocationId: 'allocation-id' })
    mockCreateNatGateway.mockResolvedValueOnce({
      NatGateway: {
        NatGatewayId: 'nat-id'
      }
    })
    mockDescribeRouteTables.mockResolvedValueOnce([
      {
        RouteTableId: 'private-rtb-id',
        Routes: [
          {
            DestinationCidrBlock: '0.0.0.0/0',
            GatewayId: 'igw-id'
          }
        ],
        Associations: [
          {
            Main: true
          }
        ]
      }
    ])
    mockCreateRouteTable.mockResolvedValueOnce({
      RouteTable: {
        RouteTableId: 'public-rtb-id'
      }
    })

    await ensureVpc({
      Region: 'region',
      Tags: { 'tag-name': 'tag-value' }
    })

    expect(mockCreateSubnet).toHaveBeenCalledWith({
      VpcId: 'default-vpc-id',
      CidrBlock: '172.31.48.0/20',
      TagSpecifications: [
        {
          ResourceType: 'subnet',
          Tags: [{ Key: 'tag-name', Value: 'tag-value' }]
        }
      ]
    })

    expect(mockAllocateAddress).toHaveBeenCalledWith({
      Domain: 'vpc',
      TagSpecifications: [
        {
          ResourceType: 'elastic-ip',
          Tags: [{ Key: 'tag-name', Value: 'tag-value' }]
        }
      ]
    })

    expect(mockCreateNatGateway).toHaveBeenCalledWith({
      SubnetId: 'public-subnet-id',
      AllocationId: 'allocation-id',
      TagSpecifications: [
        {
          ResourceType: 'natgateway',
          Tags: [{ Key: 'tag-name', Value: 'tag-value' }]
        }
      ]
    })

    expect(mockDeleteRoute).toHaveBeenCalledWith({
      DestinationCidrBlock: '0.0.0.0/0',
      RouteTableId: 'private-rtb-id'
    })

    expect(mockCreateRoute).toHaveBeenNthCalledWith(1, {
      DestinationCidrBlock: '0.0.0.0/0',
      RouteTableId: 'private-rtb-id',
      NatGatewayId: 'nat-id'
    })

    expect(mockAssociateRouteTable).toHaveBeenCalledTimes(4)

    expect(mockCreateRouteTable).toHaveBeenCalledWith({
      VpcId: 'default-vpc-id',
      TagSpecifications: [
        {
          ResourceType: 'route-table',
          Tags: [{ Key: 'tag-name', Value: 'tag-value' }]
        }
      ]
    })

    expect(mockCreateRoute).toHaveBeenNthCalledWith(2, {
      DestinationCidrBlock: '0.0.0.0/0',
      RouteTableId: 'public-rtb-id',
      GatewayId: 'igw-id'
    })

    expect(mockAssociateRouteTable).toHaveBeenLastCalledWith({
      RouteTableId: 'public-rtb-id',
      SubnetId: 'public-subnet-id'
    })
  })
})
