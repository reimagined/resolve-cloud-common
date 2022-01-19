import type { AWSError, Request } from 'aws-sdk'
import Lambda, { FunctionConfiguration } from 'aws-sdk/clients/lambda'
import { mocked } from 'jest-mock'

import { mockedSdkFunction } from '../mockedSdkFunction'
import updateFunctionEnvironment from '../../lambda/updateFunctionEnvironment'

jest.mock('../../utils')

const mockWaitFor = mocked(Lambda.prototype.waitFor)
const mockUpdateFunctionConfiguration = mockedSdkFunction(
  Lambda.prototype.updateFunctionConfiguration
)

describe('updateFunctionEnvironment', () => {
  afterEach(() => {
    mockWaitFor.mockClear()
    mockUpdateFunctionConfiguration.mockClear()
  })
  test('should function environment variables have been updated', async () => {
    mockWaitFor.mockReturnValue({
      promise: async () => ({
        Environment: { Variables: { testEnv1: 'testEnv1' } },
      } as FunctionConfiguration),
    } as Request<FunctionConfiguration, AWSError>)

    mockUpdateFunctionConfiguration.mockResolvedValue({
      FunctionArn: 'functionArn'
    })
    await updateFunctionEnvironment({
      Region: 'region',
      FunctionName: 'functionName',
      Variables: { testEnv2: 'testEnv2' }
    })

    expect(mockWaitFor).toHaveBeenCalledWith('functionUpdated', {
      FunctionName: 'functionName'
    })
    expect(mockUpdateFunctionConfiguration).toHaveBeenCalledWith({
      FunctionName: 'functionName',
      Environment: {
        Variables: { testEnv1: 'testEnv1', testEnv2: 'testEnv2' }
      }
    })
  })

  test('should failed to update function environment variables', async () => {
    mockUpdateFunctionConfiguration.mockRejectedValue(new Error())
    try {
      await updateFunctionEnvironment({
        Region: 'region',
        FunctionName: 'functionName',
        Variables: {}
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
