import Lambda, { UpdateFunctionConfigurationRequest } from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log, mergeEnvironmentVariables } from '../utils'

const updateFunctionConfiguration = async (
  params: {
    Region: string
    Variables?: { [key: string]: string | null }
  } & Exclude<UpdateFunctionConfigurationRequest, 'Environment'>,
  log: Log = getLog('UPDATE-LAMBDA-CONFIGURATION')
): Promise<{ FunctionArn: string }> => {
  const { Region, FunctionName, Variables, ...config } = params

  const lambda = new Lambda({ region: Region })

  try {
    const updateParams: UpdateFunctionConfigurationRequest = {
      FunctionName,
      ...config
    }

    if (Variables != null) {
      log.debug('Environment variables found, waiting for updated state')

      const { Environment: CurrentEnvironment } = await lambda
        .waitFor('functionUpdated', {
          FunctionName
        })
        .promise()

      log.debug('Function updated')

      if (CurrentEnvironment?.Variables == null) {
        throw new Error('Environment not found in function configuration')
      }

      updateParams.Environment = {
        Variables: mergeEnvironmentVariables(CurrentEnvironment.Variables, Variables)
      }
    }

    log.debug(`Update function configuration`)

    const updateFunctionConfigurationExecutor = retry(
      lambda,
      lambda.updateFunctionConfiguration,
      Options.Defaults.override({
        log,
        toleratedErrors: ['ResourceConflictException'],
        delay: 5000
      })
    )

    const { FunctionArn } = await updateFunctionConfigurationExecutor(updateParams)

    if (FunctionArn == null) {
      throw new Error(`Failed to get FunctionArn`)
    }

    log.debug(`Configuration update started, waiting for updated status`)

    await lambda
      .waitFor('functionUpdated', {
        FunctionName
      })
      .promise()

    log.debug(`Function configuration have been updated`)

    return { FunctionArn }
  } catch (error) {
    log.debug(`Failed to update function environment variables`)
    throw error
  }
}

export default updateFunctionConfiguration
