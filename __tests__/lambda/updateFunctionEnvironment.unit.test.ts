import Lambda from 'aws-sdk/clients/lambda'

import { mockedSdkFunction } from '../mockedSdkFunction'
import updateFunctionEnvironment from '../../lambda/updateFunctionEnvironment'

jest.mock('../../utils')

const mockGetFunctionConfiguration = mockedSdkFunction(Lambda.prototype.getFunctionConfiguration)
const mockUpdateFunctionConfiguration = mockedSdkFunction(
  Lambda.prototype.updateFunctionConfiguration
)

describe('updateFunctionEnvironment', () => {
  afterEach(() => {
    mockGetFunctionConfiguration.mockClear()
    mockUpdateFunctionConfiguration.mockClear()
  })
  test('should function environment variables have been updated', async () => {
    mockGetFunctionConfiguration.mockResolvedValue({
      Environment: { Variables: { testEnv1: 'testEnv1' } },
      State: 'Active',
      LastUpdateStatus: 'Successful'
    })
    mockUpdateFunctionConfiguration.mockResolvedValue({
      FunctionArn: 'functionArn'
    })
    await updateFunctionEnvironment({
      Region: 'region',
      FunctionName: 'functionName',
      Variables: { testEnv2: 'testEnv2' }
    })

    expect(mockGetFunctionConfiguration).toHaveBeenCalledWith({
      FunctionName: 'functionName',
      Qualifier: '$LATEST'
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
