import { getLog, Log } from './log'

export const toleratedErrors: Array<string> = [
  'ProvisionedThroughputExceededException',
  'LimitExceededException',
  'RequestLimitExceeded',
  'ThrottlingException',
  'Throttling',
  'TooManyRequestsException',
  'NetworkingError'
]

interface OptionsStruct {
  readonly maxAttempts?: number
  readonly delay?: number
  readonly silent?: boolean
  readonly log?: Log
  readonly expectedErrors?: string[]
  readonly toleratedErrors?: string[]
}

export class Options implements OptionsStruct {
  public readonly maxAttempts: number = 10
  public readonly delay: number = 1000
  public readonly silent: boolean = false
  public readonly log: Log = getLog('retry')
  public readonly expectedErrors: string[] = []
  public readonly toleratedErrors: string[] = []

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

type AwsServicePromiseArgumentsType<T> = T extends { (args: infer A1): any; (args: infer A2): any }
  ? A1 | A2
  : T extends (args: infer A) => any
  ? A
  : never

type AwsServicePromiseReturnType<T> = T extends { (args: any): infer R1; (args: any): infer R2 }
  ? R1 | R2
  : T extends (args: any) => infer R
  ? R
  : never

type UnwrapAwsPromise<AWSWrappedResult> = AWSWrappedResult extends {
  // eslint-disable-next-line no-empty-pattern
  promise: ({}) => infer AWSPureResult
}
  ? AWSPureResult
  : never

type GetPromiseType<PromiseLike> = PromiseLike extends Promise<infer R> ? R : never

export function retry<Callback extends (...args: any) => any>(
  client: Record<string, any>,
  callable: Callback,
  options: Options = Options.Defaults
): (
  params: AwsServicePromiseArgumentsType<Callback>
) => Promise<GetPromiseType<UnwrapAwsPromise<AwsServicePromiseReturnType<Callback>>>> {
  return async (
    params: AwsServicePromiseArgumentsType<Callback>
  ): Promise<GetPromiseType<UnwrapAwsPromise<AwsServicePromiseReturnType<Callback>>>> => {
    const { maxAttempts, silent, log, delay } = options
    const callback = callable.bind(client)
    let lastError: Error | undefined

    for (let attempt = 0; attempt < maxAttempts; ) {
      try {
        return await callback(params).promise()
      } catch (error) {
        if (error != null && options.expectedErrors.includes(error.code)) {
          throw error
        }

        attempt +=
          error != null && error.code != null && toleratedErrors.includes(error.code) ? 0 : 1

        if (attempt !== maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        if (!silent) {
          log.debug(
            `${callable.name} invocation attempt [${attempt}/${maxAttempts}], last error ${error.message}`
          )
        }

        lastError = error
      }
    }

    if (!silent && lastError != null) {
      log.error(lastError)
    }
    throw lastError
  }
}
