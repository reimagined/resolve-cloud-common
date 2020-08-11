import SecretsManager from 'aws-sdk/clients/secretsmanager'

import { mockedSdkFunction } from '../mockedSdkFunction'
import createSecret from '../../secretsmanager/createSecret'

jest.mock('../../utils')

const mockCreateSecret = mockedSdkFunction(SecretsManager.prototype.createSecret)

describe('createSecret', () => {
  afterEach(() => {
    mockCreateSecret.mockClear()
  })
  test('should the secret has been created', async () => {
    mockCreateSecret.mockResolvedValue({ ARN: 'arn' })
    const result = await createSecret({
      Region: 'region',
      Name: 'name',
      Description: 'description',
      SecretString: 'secretString',
    })

    expect(mockCreateSecret).toHaveBeenCalledWith({
      Name: 'name',
      Description: 'description',
      SecretString: 'secretString',
      Tags: [{ Key: 'Owner', Value: 'reimagined' }],
    })
    expect(result).toEqual('arn')
  })

  test('should failed to create a secret', async () => {
    mockCreateSecret.mockRejectedValue(new Error())
    try {
      await createSecret({
        Region: 'region',
        Name: 'name',
        Description: 'description',
        SecretString: 'secretString',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test('should failed "Unknown ARN"', async () => {
    mockCreateSecret.mockResolvedValue({})
    try {
      await createSecret({
        Region: 'region',
        Name: 'name',
        Description: 'description',
        SecretString: 'secretString',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
