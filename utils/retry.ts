import { getLog, Log } from './log'

const toleratedErrors: Array<string> = [
  'ProvisionedThroughputExceededException',
  'LimitExceededException',
  'RequestLimitExceeded',
  'ThrottlingException',
  'TooManyRequestsException',
  'NetworkingError'
]

interface OptionsStruct {
  readonly maxAttempts?: number
  readonly delay?: number
  readonly silent?: boolean
  readonly log?: Log
  readonly expectedErrors?: string[]
}

export class Options implements OptionsStruct {
  public readonly maxAttempts: number = 10
  public readonly delay: number = 1000
  public readonly silent: boolean = false
  public readonly log: Log = getLog('retry')
  public readonly expectedErrors: string[] = []

  public static get Defaults(): Options {
    return new Options({})
  }

  private constructor(opts: OptionsStruct) {
    Object.assign(this, opts)
  }

  public override(opts: OptionsStruct): Options {
    return new Options({
      ...this,
      ...opts
    })
  }
}

interface SDKRequest<TResponse> {
  promise: () => Promise<TResponse>
}

export function retry<TParams extends object, TResponse extends object>(
  client: object,
  callable: (params: TParams) => SDKRequest<TResponse>,
  options: Options = Options.Defaults
): (params: TParams) => Promise<TResponse> {
  return function wrapper(params: TParams): Promise<TResponse> {
    const { maxAttempts, silent, log, delay } = options
    const callback = callable.bind(client)

    async function proxy(attempt: number, lastError?: Error): Promise<TResponse> {
      if (attempt >= maxAttempts) {
        if (!silent && lastError) {
          log.error(lastError)
        }
        throw lastError
      }

      try {
        return await callback(params).promise()
      } catch (error) {
        if (options.expectedErrors.includes(error.code)) {
          throw error
        }

        const nextAttempt = attempt + (error.code && toleratedErrors.includes(error.code) ? 0 : 1)

        if (nextAttempt > attempt) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        if (!silent) {
          log.debug(
            `${callable.name} invocation attempt [${nextAttempt}/${maxAttempts}], last error ${error.message}`
          )
        }

        return proxy(nextAttempt, error)
      }
    }

    return proxy(0)
  }
}
