import SecretsManager from 'aws-sdk/clients/secretsmanager'

import { mockedSdkFunction } from '../mockedSdkFunction'
import generatePostgresPassword from '../../secretsmanager/generatePostgresPassword'

jest.mock('../../utils')

const mockGetRandomPassword = mockedSdkFunction(SecretsManager.prototype.getRandomPassword)

describe('generatePostgresPassword', () => {
  afterEach(() => {
    mockGetRandomPassword.mockClear()
  })
  test('should the password has been generated', async () => {
    mockGetRandomPassword.mockResolvedValue({ RandomPassword: 'RandomPassword' })
    const result = await generatePostgresPassword({ Region: 'region' })

    expect(mockGetRandomPassword).toHaveBeenCalledWith({
      ExcludePunctuation: true,
      IncludeSpace: false,
      PasswordLength: 30,
      RequireEachIncludedType: true,
    })
    expect(result).toEqual('RandomPassword')
  })

  test('should failed to generate a password', async () => {
    mockGetRandomPassword.mockRejectedValue(new Error())
    try {
      await generatePostgresPassword({ Region: 'region' })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test('should failed "Unknown password"', async () => {
    mockGetRandomPassword.mockResolvedValue({})
    try {
      await generatePostgresPassword({ Region: 'region' })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
