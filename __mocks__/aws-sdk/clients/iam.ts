const IAM = jest.fn()

IAM.prototype.listRolePolicies = jest.fn()
IAM.prototype.deleteRolePolicy = jest.fn()
IAM.prototype.deleteRole = jest.fn()
IAM.prototype.updateAssumeRolePolicy = jest.fn()
IAM.prototype.updateRole = jest.fn()
IAM.prototype.createRole = jest.fn()
IAM.prototype.tagRole = jest.fn()
IAM.prototype.untagRole = jest.fn()
IAM.prototype.getRole = jest.fn()
IAM.prototype.putRolePolicy = jest.fn()

export default IAM
