import Lambda, { FunctionConfiguration } from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      FunctionName: string
    },
    log?: Log
  ): Promise<FunctionConfiguration>
}

const getFunctionConfiguration: TMethod = async (
  { Region, FunctionName },
  log = getLog('GET-FUNCTION-CONFIGURATION')
) => {
  try {
    const lambda = new Lambda({ region: Region })

    log.debug(`Get current function environment variables`)

    const getFunctionConfig = retry(
      lambda,
      lambda.getFunctionConfiguration,
      Options.Defaults.override({ log })
    )
    const functionConfiguration = await getFunctionConfig({
      FunctionName,
      Qualifier: '$LATEST'
    })

    if (functionConfiguration == null) {
      throw new Error('Function configuration not found')
    }

    log.debug(`Function configuration have been got`)

    return functionConfiguration
  } catch (error) {
    log.debug(`Failed to get function configuration`)
    throw error
  }
}

export default getFunctionConfiguration
