import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      FunctionName: string
      StatementId: string
    },
    log?: Log
  ): Promise<void>
}

const deleteFunctionPermission: TMethod = async (
  { Region, FunctionName, StatementId },
  log = getLog(`DELETE-FUNCTION-PERMISSION`)
) => {
  const lambda = new Lambda({ region: Region })

  try {
    log.debug(`Delete the function "${FunctionName}" permission "${StatementId}"`)
    const removePermission = retry(
      lambda,
      lambda.removePermission,
      Options.Defaults.override({ log })
    )
    await removePermission({
      FunctionName,
      StatementId,
    })
    log.debug(`The function "${FunctionName}" permission has been deleted`)
  } catch (error) {
    log.error(`Failed to delete the function "${FunctionName}" permission "${StatementId}"`)
    throw error
  }
}

export default deleteFunctionPermission
