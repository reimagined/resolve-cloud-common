import IAM from 'aws-sdk/clients/iam'

import { mockedSdkFunction } from '../mockedSdkFunction'
import ensureRoleWithPolicy from '../../iam/ensureRoleWithPolicy'

jest.mock('../../utils')

const mockUpdateAssumeRolePolicy = mockedSdkFunction(IAM.prototype.updateAssumeRolePolicy)
const mockUpdateRole = mockedSdkFunction(IAM.prototype.updateRole)
const mockCreateRole = mockedSdkFunction(IAM.prototype.createRole)
const mockTagRole = mockedSdkFunction(IAM.prototype.tagRole)
const mockUntagRole = mockedSdkFunction(IAM.prototype.untagRole)
const mockGetRole = mockedSdkFunction(IAM.prototype.getRole)
const mockPutRolePolicy = mockedSdkFunction(IAM.prototype.putRolePolicy)
const mockListRolePolicies = mockedSdkFunction(IAM.prototype.listRolePolicies)
const mockDeleteRolePolicy = mockedSdkFunction(IAM.prototype.deleteRolePolicy)

class NoSuchEntityError extends Error {
  code = 'NoSuchEntity'
}

describe('ensureRoleWithPolicy', () => {
  afterEach(() => {
    mockUpdateAssumeRolePolicy.mockReset()
    mockUpdateRole.mockReset()
    mockCreateRole.mockReset()
    mockTagRole.mockReset()
    mockUntagRole.mockReset()
    mockGetRole.mockReset()
    mockPutRolePolicy.mockReset()
    mockListRolePolicies.mockReset()
    mockDeleteRolePolicy.mockReset()
  })
  test('should role has been ensure', async () => {
    mockGetRole.mockResolvedValue({
      Role: {
        Arn: 'roleArn',
        Tags: [
          { Key: 'key1', Value: 'value1' },
          { Key: 'key2', Value: 'value2' }
        ],
        Path: 'path',
        RoleName: 'roleName',
        RoleId: 'roleId',
        CreateDate: new Date()
      }
    })
    mockTagRole.mockResolvedValue({})
    mockUntagRole.mockResolvedValue({})
    mockUpdateAssumeRolePolicy.mockResolvedValue({})
    mockUpdateRole.mockResolvedValue({})
    mockListRolePolicies.mockResolvedValueOnce({
      PolicyNames: ['policyName'],
      IsTruncated: true,
      Marker: 'marker'
    })
    mockListRolePolicies.mockResolvedValue({ PolicyNames: ['policyName'] })
    mockPutRolePolicy.mockResolvedValue({})

    const result = await ensureRoleWithPolicy({
      Region: 'region',
      AssumeRolePolicyDocument: {
        Version: '1.2.3',
        Statement: [{ Principal: { Service: '*' }, Action: 'lambda:invoke', Effect: 'Allow' }]
      },
      RoleName: 'roleName',
      PolicyName: 'policyName',
      PolicyDocument: {
        Version: '1.2.3',
        Statement: [{ Resource: '*', Action: 'lambda:invoke', Effect: 'Allow' }]
      }
    })

    expect(mockGetRole).toHaveBeenCalledWith({ RoleName: 'roleName' })
    expect(mockTagRole).toHaveBeenCalledWith({
      RoleName: 'roleName',
      Tags: [{ Key: 'Owner', Value: 'reimagined' }]
    })
    expect(mockUntagRole).toHaveBeenCalledWith({
      RoleName: 'roleName',
      TagKeys: ['key1', 'key2']
    })
    expect(mockUpdateAssumeRolePolicy).toHaveBeenCalledWith({
      RoleName: 'roleName',
      PolicyDocument: JSON.stringify({
        Version: '1.2.3',
        Statement: [{ Principal: { Service: '*' }, Action: 'lambda:invoke', Effect: 'Allow' }]
      })
    })
    expect(mockUpdateRole).toHaveBeenCalledWith({
      RoleName: 'roleName',
      Description: ''
    })
    expect(mockListRolePolicies).toHaveBeenNthCalledWith(1, { RoleName: 'roleName' })
    expect(mockListRolePolicies).toHaveBeenNthCalledWith(2, {
      RoleName: 'roleName',
      Marker: 'marker'
    })
    expect(mockPutRolePolicy).toHaveBeenCalledWith({
      RoleName: 'roleName',
      PolicyName: 'policyName',
      PolicyDocument: JSON.stringify({
        Version: '1.2.3',
        Statement: [{ Resource: '*', Action: 'lambda:invoke', Effect: 'Allow' }]
      })
    })
    expect(mockCreateRole).not.toHaveBeenCalled()
    expect(result).toEqual('roleArn')
  })

  test('should the role has been created with ARN', async () => {
    mockGetRole.mockRejectedValueOnce(new NoSuchEntityError())
    mockUpdateRole.mockRejectedValue(new NoSuchEntityError())
    mockCreateRole.mockResolvedValue({
      Role: {
        Arn: 'roleArn',
        Path: 'path',
        RoleName: 'roleName',
        RoleId: 'roleId',
        CreateDate: new Date()
      }
    })
    mockListRolePolicies.mockResolvedValue({ PolicyNames: ['policyName'] })
    const result = await ensureRoleWithPolicy({
      Region: 'region',
      AssumeRolePolicyDocument: {
        Version: '1.2.3',
        Statement: [{ Principal: { Service: '*' }, Action: 'lambda:invoke', Effect: 'Allow' }]
      },
      RoleName: 'roleName',
      PolicyName: 'policyName',
      PolicyDocument: {
        Version: '1.2.3',
        Statement: [{ Resource: '*', Action: 'lambda:invoke', Effect: 'Allow' }]
      }
    })
    expect(mockCreateRole).toHaveBeenCalledWith({
      AssumeRolePolicyDocument: JSON.stringify({
        Version: '1.2.3',
        Statement: [{ Principal: { Service: '*' }, Action: 'lambda:invoke', Effect: 'Allow' }]
      }),
      RoleName: 'roleName',
      Description: '',
      Tags: [{ Key: 'Owner', Value: 'reimagined' }]
    })
    expect(result).toEqual('roleArn')
  })

  test('should failed to ensure role', async () => {
    mockUpdateRole.mockRejectedValue(new Error())
    try {
      await ensureRoleWithPolicy({
        Region: 'region',
        AssumeRolePolicyDocument: {
          Version: '1.2.3',
          Statement: [{ Principal: { Service: '*' }, Action: 'lambda:invoke', Effect: 'Allow' }]
        },
        RoleName: 'roleName',
        PolicyName: 'policyName',
        PolicyDocument: {
          Version: '1.2.3',
          Statement: [{ Resource: '*', Action: 'lambda:invoke', Effect: 'Allow' }]
        }
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test('should failed after 5 attempts getRole', async () => {
    mockGetRole.mockResolvedValueOnce({
      Role: {
        Arn: 'roleArn',
        Tags: [
          { Key: 'key1', Value: 'value1' },
          { Key: 'key2', Value: 'value2' }
        ],
        Path: 'path',
        RoleName: 'roleName',
        RoleId: 'roleId',
        CreateDate: new Date()
      }
    })
    mockGetRole.mockRejectedValue(new Error())
    try {
      await ensureRoleWithPolicy({
        Region: 'region',
        AssumeRolePolicyDocument: {
          Version: '1.2.3',
          Statement: [{ Principal: { Service: '*' }, Action: 'lambda:invoke', Effect: 'Allow' }]
        },
        RoleName: 'roleName',
        PolicyName: 'policyName',
        PolicyDocument: {
          Version: '1.2.3',
          Statement: [{ Resource: '*', Action: 'lambda:invoke', Effect: 'Allow' }]
        }
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test('should delete ONLY redundant role policies', async () => {
    mockGetRole.mockRejectedValueOnce(new NoSuchEntityError())
    mockUpdateRole.mockRejectedValue(new NoSuchEntityError())
    mockCreateRole.mockResolvedValue({
      Role: {
        Arn: 'roleArn',
        Path: 'path',
        RoleName: 'roleName',
        RoleId: 'roleId',
        CreateDate: new Date()
      }
    })
    mockListRolePolicies.mockResolvedValue({
      PolicyNames: ['policyName', 'redundantPolicyName'],
      IsTruncated: false
    })

    await ensureRoleWithPolicy({
      Region: 'region',
      AssumeRolePolicyDocument: {
        Version: '1.2.3',
        Statement: [{ Principal: { Service: '*' }, Action: 'lambda:invoke', Effect: 'Allow' }]
      },
      RoleName: 'roleName',
      PolicyName: 'policyName',
      PolicyDocument: {
        Version: '1.2.3',
        Statement: [{ Resource: '*', Action: 'lambda:invoke', Effect: 'Allow' }]
      }
    })

    expect(mockDeleteRolePolicy).toBeCalledWith({
      RoleName: 'roleName',
      PolicyName: 'redundantPolicyName'
    })

    expect(mockDeleteRolePolicy).not.toBeCalledWith(
      expect.objectContaining({
        RoleName: 'roleName',
        PolicyName: 'policyName'
      })
    )

    expect(mockDeleteRolePolicy).toBeCalledTimes(1)
  })
})
