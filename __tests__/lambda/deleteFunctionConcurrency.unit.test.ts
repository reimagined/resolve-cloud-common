import Lambda from 'aws-sdk/clients/lambda'

import { mockedSdkFunction } from '../mockedSdkFunction'
import deleteFunctionConcurrency from '../../lambda/deleteFunctionConcurrency'

jest.mock('../../utils')

const mockDeleteFunctionConcurrency = mockedSdkFunction(Lambda.prototype.deleteFunctionConcurrency)

describe.only('deleteFunctionConcurrency', () => {
  afterEach(() => {
    mockDeleteFunctionConcurrency.mockClear()
  })
  test('should function concurrency has been deleted', async () => {
    mockDeleteFunctionConcurrency.mockResolvedValue({})
    await deleteFunctionConcurrency({
      Region: 'region',
      FunctionName: 'functionName',
    })

    expect(mockDeleteFunctionConcurrency).toHaveBeenCalledWith({
      FunctionName: 'functionName',
    })
  })

  test('should failed to delete function concurrency', async () => {
    mockDeleteFunctionConcurrency.mockRejectedValue(new Error())
    try {
      await deleteFunctionConcurrency({
        Region: 'region',
        FunctionName: 'functionName',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
