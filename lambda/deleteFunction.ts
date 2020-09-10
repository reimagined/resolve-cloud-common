import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteFunction = async (
  params: {
    Region: string
    FunctionName: string
    IfExists?: boolean
  },
  log: Log = getLog(`DELETE-FUNCTION`)
): Promise<void> => {
  const { Region, FunctionName, IfExists = false } = params

  const lambda = new Lambda({ region: Region })

  try {
    log.debug(`Delete the function "${FunctionName}"`)
    const removeFunction = retry(
      lambda,
      lambda.deleteFunction,
      Options.Defaults.override({ log, expectedErrors: ['ResourceNotFoundException'] })
    )
    await removeFunction({
      FunctionName
    })
    log.debug(`The function "${FunctionName}" has been deleted`)
  } catch (error) {
    if (IfExists) {
      log.error(`Skip delete the function "${FunctionName}"`)
      ignoreNotFoundException(error)
    } else {
      log.error(`Failed to delete the function "${FunctionName}"`)
      throw error
    }
  }
}

export default deleteFunction
