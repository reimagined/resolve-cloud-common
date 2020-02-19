import Lambda from 'aws-sdk/clients/lambda'

import { mockedSdkFunction } from '../mockedSdkFunction'
import invokeFunction from '../../lambda/invokeFunction'

jest.mock('../../utils')

const mockInvoke = mockedSdkFunction(Lambda.prototype.invoke)

describe('invokeFunction', () => {
  afterEach(() => {
    mockInvoke.mockClear()
  })
  test('should function has been invoked', async () => {
    mockInvoke.mockResolvedValue({ Payload: JSON.stringify({}) })
    const result = await invokeFunction({
      Region: 'region',
      FunctionName: 'functionName',
      Payload: {},
      InvocationType: 'RequestResponse'
    })

    expect(mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'functionName',
      Payload: JSON.stringify({}),
      InvocationType: 'RequestResponse'
    })
    expect(result).toEqual({})
  })

  test('should failed to invoke function with payload = null', async () => {
    mockInvoke.mockResolvedValue({ FunctionError: '' })
    try {
      await invokeFunction({
        Region: 'region',
        FunctionName: 'functionName',
        Payload: {},
        InvocationType: 'RequestResponse'
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test('should failed to invoke function', async () => {
    mockInvoke.mockRejectedValue(new Error())
    try {
      await invokeFunction({
        Region: 'region',
        FunctionName: 'functionName',
        Payload: {},
        InvocationType: 'RequestResponse'
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
