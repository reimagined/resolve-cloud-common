import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const deleteFunctionConcurrency = async (
  params: {
    Region: string
    FunctionName: string
  },
  log: Log = getLog(`DELETE-FUNCTION-CONCURRENCY`)
): Promise<void> => {
  const { FunctionName, Region } = params

  const lambda = new Lambda({ region: Region })

  try {
    log.debug(`Delete function concurrency "${FunctionName}"`)
    const removeFunctionConcurrency = retry(
      lambda,
      lambda.deleteFunctionConcurrency,
      Options.Defaults.override({ log, maxAttempts: 1 })
    )
    await removeFunctionConcurrency({
      FunctionName
    })
    log.debug(`Function concurrency "${FunctionName}" has been deleted`)
  } catch (error) {
    log.error(`Failed to delete function concurrency "${FunctionName}"`)
    throw error
  }
}

export default deleteFunctionConcurrency
