import Lambda, { UpdateFunctionConfigurationRequest } from 'aws-sdk/clients/lambda'

import getFunctionConfiguration from './getFunctionConfiguration'
import { retry, Options, getLog, Log } from '../utils'

const MAX_ATTEMPTS = 180
const ATTEMPT_TIMEOUT = 1000

const updateFunctionConfiguration = async (
  params: {
    Region: string
  } & UpdateFunctionConfigurationRequest,
  log: Log = getLog('UPDATE-LAMBDA-CONFIGURATION')
): Promise<{ FunctionArn: string }> => {
  const { Region, FunctionName, ...config } = params

  const lambda = new Lambda({ region: Region })

  try {
    log.debug(`Update function configuration`)
    const updateFunctionConfigurationExecutor = retry(
      lambda,
      lambda.updateFunctionConfiguration,
      Options.Defaults.override({ log, toleratedErrors: ['ResourceConflictException'] })
    )

    const { FunctionArn } = await updateFunctionConfigurationExecutor({
      FunctionName,
      ...config
    })

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      const { State, LastUpdateStatus } = await getFunctionConfiguration({
        Region,
        FunctionName
      })

      if (
        State != null &&
        State !== 'Pending' &&
        LastUpdateStatus != null &&
        LastUpdateStatus !== 'InProgress'
      ) {
        break
      }

      log.verbose(`Lambda is pending [${i}/${MAX_ATTEMPTS}]`)
      await new Promise((resolve) => setTimeout(resolve, ATTEMPT_TIMEOUT))
    }

    log.debug(`Function environment variables have been updated`)

    if (FunctionArn == null) {
      throw new Error(`Failed to get FunctionArn`)
    }

    return { FunctionArn }
  } catch (error) {
    log.debug(`Failed to update function environment variables`)
    throw error
  }
}

export default updateFunctionConfiguration
