import IAM from 'aws-sdk/clients/iam'

import { mockedSdkFunction } from '../mockedSdkFunction'
import deleteRole from '../../iam/deleteRole'

jest.mock('../../utils')

const mockListRolePolicies = mockedSdkFunction(IAM.prototype.listRolePolicies)
const mockDeleteRolePolicy = mockedSdkFunction(IAM.prototype.deleteRolePolicy)
const mockDeleteRole = mockedSdkFunction(IAM.prototype.deleteRole)
const mockGetRole = mockedSdkFunction(IAM.prototype.getRole)

describe('deleteRole', () => {
  afterEach(() => {
    mockListRolePolicies.mockClear()
    mockDeleteRolePolicy.mockClear()
    mockDeleteRole.mockClear()
    mockGetRole.mockClear()
  })
  test('should the role has been deleted', async () => {
    mockListRolePolicies.mockResolvedValueOnce({
      PolicyNames: ['policyName'],
      IsTruncated: true,
      Marker: 'marker'
    })
    mockGetRole.mockResolvedValueOnce({
      Role: {
        CreateDate: new Date(),
        Path: 'path',
        RoleId: 'roleId',
        RoleName: 'roleName',
        Arn: 'arn',
        Tags: [{ Key: 'Key', Value: 'Value' }]
      }
    })
    mockListRolePolicies.mockResolvedValue({ PolicyNames: ['policyName'] })
    await deleteRole({
      Region: 'region',
      RoleName: 'roleName'
    })

    expect(mockListRolePolicies).toHaveBeenNthCalledWith(1, { RoleName: 'roleName' })
    expect(mockListRolePolicies).toHaveBeenNthCalledWith(2, {
      RoleName: 'roleName',
      Marker: 'marker'
    })
    expect(mockDeleteRolePolicy).toHaveBeenCalledWith({
      RoleName: 'roleName',
      PolicyName: 'policyName'
    })
    expect(mockDeleteRole).toHaveBeenCalledWith({ RoleName: 'roleName' })
  })
})
