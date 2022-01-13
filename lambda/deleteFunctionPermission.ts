import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const deleteFunctionPermission = async (
  params: {
    Region: string
    FunctionName: string
    StatementId: string
  },
  log: Log = getLog(`DELETE-FUNCTION-PERMISSION`)
): Promise<void> => {
  const { Region, FunctionName, StatementId } = params

  const lambda = new Lambda({ region: Region })

  try {
    log.debug(`Delete the function "${FunctionName}" permission "${StatementId}"`)
    const removePermission = retry(
      lambda,
      lambda.removePermission,
      Options.Defaults.override({ log, toleratedErrors: ['ResourceConflictException'] })
    )
    await removePermission({
      FunctionName,
      StatementId
    })
    log.debug(`The function "${FunctionName}" permission has been deleted`)
  } catch (error) {
    log.error(`Failed to delete the function "${FunctionName}" permission "${StatementId}"`)
    throw error
  }
}

export default deleteFunctionPermission
