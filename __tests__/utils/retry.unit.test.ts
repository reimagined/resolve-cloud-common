import { retry, Options } from '../../utils/retry'
import { getLog } from '../../utils/log'

describe('Options', () => {
  test('defaults are all set', () => {
    const opts = Options.Defaults

    expect(opts.maxAttempts).toEqual(expect.any(Number))
    expect(opts.delay).toEqual(expect.any(Number))
    expect(opts.silent).toEqual(expect.any(Boolean))
    expect(opts.log).toEqual(expect.any(Object))
  })

  test('overriding', () => {
    const customLog = getLog('custom')

    expect(Options.Defaults.override({ maxAttempts: 777 }).maxAttempts).toEqual(777)
    expect(Options.Defaults.override({ delay: 777 }).delay).toEqual(777)
    expect(Options.Defaults.override({ silent: false }).silent).toEqual(false)
    expect(Options.Defaults.override({ silent: true }).silent).toEqual(true)
    expect(Options.Defaults.override({ log: customLog }).log).toEqual(customLog)
  })
})

describe('retry', () => {
  interface MockRequest {
    requestData: string
  }

  interface MockResponse {
    responseData: string
  }

  class MockSdkResponse {
    readonly result
    readonly promise

    constructor(result) {
      this.result = result
      this.promise = jest.fn(() =>
        this.result instanceof Error ? Promise.reject(this.result) : Promise.resolve(this.result)
      )
    }
  }

  class MockSdk {
    public readonly prop
    public readonly method

    constructor(prop: string) {
      this.prop = prop
      this.method = jest.fn()
    }

    public invoke(...args): MockSdkResponse {
      return this.method(...args)
    }
  }

  let opts: Options
  let mockSdk: MockSdk

  beforeEach(() => {
    opts = Options.Defaults.override({
      maxAttempts: 2,
      delay: 1,
      silent: true
    })
    mockSdk = new MockSdk('region')
  })

  test('first invocation succeeded', async () => {
    const response = new MockSdkResponse('result')
    mockSdk.method.mockReturnValue(response)

    const wrapper = retry(mockSdk, mockSdk.invoke, opts)

    await expect(wrapper('argA')).resolves.toEqual('result')
    expect(mockSdk.method).toHaveBeenCalledWith('argA')
    expect(response.promise).toHaveBeenCalled()
  })

  test('first invocation succeeded (generic)', async () => {
    const response = new MockSdkResponse({ responseData: 'response-data' })
    mockSdk.method.mockReturnValue(response)

    const wrapper = retry(mockSdk, mockSdk.invoke, opts)

    await expect(wrapper({ requestData: 'data' })).resolves.toEqual({
      responseData: 'response-data'
    })
    expect(mockSdk.method).toHaveBeenCalledWith({ requestData: 'data' })
    expect(response.promise).toHaveBeenCalled()
  })

  test('last invocation succeeded', async () => {
    mockSdk.method
      .mockReturnValueOnce(new MockSdkResponse(Error('error')))
      .mockReturnValueOnce(new MockSdkResponse('result'))

    const wrapper = retry(mockSdk, mockSdk.invoke, opts)

    await expect(wrapper('argA')).resolves.toEqual('result')
    expect(mockSdk.method).toHaveBeenCalledTimes(2)
  })

  test('max attempts exceed and last error returned', async () => {
    const strictOpts = opts.override({ maxAttempts: 1 })

    mockSdk.method
      .mockReturnValueOnce(new MockSdkResponse(Error('error')))
      .mockReturnValueOnce(new MockSdkResponse('result'))

    const wrapper = retry(mockSdk, mockSdk.invoke, strictOpts)

    await expect(wrapper('argA')).rejects.toEqual(Error('error'))
    expect(mockSdk.method).toHaveBeenCalledTimes(1)
  })
})
