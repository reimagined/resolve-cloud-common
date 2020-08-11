import Lambda from 'aws-sdk/clients/lambda'

import { mockedSdkFunction } from '../mockedSdkFunction'
import setFunctionConcurrency from '../../lambda/setFunctionConcurrency'

jest.mock('../../utils')

const mockPutFunctionConcurrency = mockedSdkFunction(Lambda.prototype.putFunctionConcurrency)

describe('setFunctionConcurrency', () => {
  afterEach(() => {
    mockPutFunctionConcurrency.mockClear()
  })
  test('should function concurrency has been set', async () => {
    mockPutFunctionConcurrency.mockResolvedValue({})
    await setFunctionConcurrency({
      Region: 'region',
      FunctionName: 'functionName',
      Concurrency: 1,
    })

    expect(mockPutFunctionConcurrency).toHaveBeenCalledWith({
      FunctionName: 'functionName',
      ReservedConcurrentExecutions: 1,
    })
  })

  test('should failed to set function concurrency', async () => {
    mockPutFunctionConcurrency.mockRejectedValue(new Error())
    try {
      await setFunctionConcurrency({
        Region: 'region',
        FunctionName: 'functionName',
        Concurrency: 1,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
