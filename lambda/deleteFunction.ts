import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      FunctionName: string
    },
    log?: Log
  ): Promise<void>
}

const deleteFunction: TMethod = async (
  { Region, FunctionName },
  log = getLog(`DELETE-FUNCTION`)
) => {
  const lambda = new Lambda({ region: Region })

  try {
    log.debug(`Delete the function "${FunctionName}"`)
    const removeFunction = retry(lambda, lambda.deleteFunction, Options.Defaults.override({ log }))
    await removeFunction({
      FunctionName,
    })
    log.debug(`The function "${FunctionName}" has been deleted`)
  } catch (error) {
    log.error(`Failed to delete the function "${FunctionName}"`)
    throw error
  }
}

export default deleteFunction
