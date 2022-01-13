import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const setFunctionConcurrency = async (
  params: {
    FunctionName: string
    Concurrency: number
    Region: string
  },
  log: Log = getLog('SET-FUNCTION-CONCURRENCY')
): Promise<void> => {
  const { FunctionName, Concurrency, Region } = params

  const lambda = new Lambda({ region: Region })

  try {
    log.debug(`Set the function concurrency ${JSON.stringify(FunctionName)} = ${Concurrency}`)
    const putFunctionConcurrency = retry(
      lambda,
      lambda.putFunctionConcurrency,
      Options.Defaults.override({
        log,
        maxAttempts: 1,
        toleratedErrors: ['ResourceConflictException']
      })
    )
    await putFunctionConcurrency({
      FunctionName,
      ReservedConcurrentExecutions: Concurrency
    })
    log.debug(`The function concurrency ${JSON.stringify(FunctionName)} has been set`)
  } catch (error) {
    log.error(
      `Failed to set the function concurrency ${JSON.stringify(FunctionName)} = ${Concurrency}`
    )
    throw error
  }
}

export default setFunctionConcurrency
