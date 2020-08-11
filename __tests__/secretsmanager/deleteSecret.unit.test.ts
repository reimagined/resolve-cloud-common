import SecretsManager from 'aws-sdk/clients/secretsmanager'

import { mockedSdkFunction } from '../mockedSdkFunction'
import deleteSecret from '../../secretsmanager/deleteSecret'

jest.mock('../../utils')

const mockDeleteSecret = mockedSdkFunction(SecretsManager.prototype.deleteSecret)

describe('deleteSecret', () => {
  afterEach(() => {
    mockDeleteSecret.mockClear()
  })
  test('should the secret has been deleted', async () => {
    mockDeleteSecret.mockResolvedValue({})
    await deleteSecret({
      Region: 'region',
      Name: 'name',
    })

    expect(mockDeleteSecret).toHaveBeenCalledWith({
      SecretId: 'name',
      ForceDeleteWithoutRecovery: true,
    })
  })

  test('should failed to delete the secret', async () => {
    mockDeleteSecret.mockRejectedValue(new Error())
    try {
      await deleteSecret({
        Region: 'region',
        Name: 'name',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
