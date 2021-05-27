import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const updateFunctionEnvironment = async (
  params: {
    Region: string
    FunctionName: string
    Variables: {
      [key: string]: string | null
    }
  },
  log: Log = getLog('UPDATE-LAMBDA-ENVIRONMENT')
): Promise<void> => {
  const { Region, FunctionName, Variables } = params

  const lambda = new Lambda({ region: Region })

  log.debug(`Get current function environment variables`)

  const getFunctionConfiguration = retry(
    lambda,
    lambda.getFunctionConfiguration,
    Options.Defaults.override({ log })
  )
  const { Environment: { Variables: currentVars } = { Variables: {} } } =
    await getFunctionConfiguration({
      FunctionName,
      Qualifier: '$LATEST'
    })

  log.debug(`Function environment variables have been got`)

  try {
    log.debug(`Update function environment variables`)
    const updateFunctionConfiguration = retry(
      lambda,
      lambda.updateFunctionConfiguration,
      Options.Defaults.override({ log })
    )
    const nextVariables: Record<string, string> = { ...currentVars }
    for (const [key, value] of Object.entries(Variables) as Array<[string, string | null]>) {
      if (value == null) {
        delete nextVariables[key]
      } else {
        nextVariables[key] = value
      }
    }

    await updateFunctionConfiguration({
      FunctionName,
      Environment: {
        Variables: nextVariables
      }
    })
  } catch (error) {
    log.debug(`Failed to update function environment variables`)
    throw error
  }

  log.debug(`Function environment variables have been updated`)
}

export default updateFunctionEnvironment
