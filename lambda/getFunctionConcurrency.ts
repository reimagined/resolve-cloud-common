import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options } from '../utils/retry'
import { getLog, Log } from '../utils/log'

interface TMethod {
  (
    params: {
      Region: string
      FunctionName: string
    },
    log?: Log
  ): Promise<number>
}

const getFunctionConcurrency: TMethod = async (
  { Region, FunctionName },
  log: Log = getLog('GET-FUNCTION-CONCURRENCY')
) => {
  try {
    log.debug(`Get the function "${FunctionName}" concurrency`)

    const lambda = new Lambda({ region: Region })

    const getFunction = retry(
      lambda,
      lambda.getFunction,
      Options.Defaults.override({ log, maxAttempts: 1 })
    )
    const { Concurrency } = await getFunction({
      FunctionName,
    })

    log.debug(`The function "${FunctionName}" concurrency has been got`)
    let concurrency = Infinity
    if (Concurrency != null && Concurrency.ReservedConcurrentExecutions != null) {
      concurrency = Concurrency.ReservedConcurrentExecutions
    }
    log.verbose(`Concurrency = ${concurrency}`)
    return concurrency
  } catch (error) {
    log.debug(`Failed to get the function "${FunctionName}" concurrency`)
    throw error
  }
}

export default getFunctionConcurrency
