import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const addFunctionPermission = async (
  params: {
    Region: string
    FunctionName: string
    Action: string
    Principal: string
    StatementId: string
    SourceArn: string
  },
  log: Log = getLog('ADD-FUNCTION-PERMISSION')
): Promise<void> => {
  const { Region, FunctionName, Action, Principal, StatementId, SourceArn } = params

  const lambda = new Lambda({ region: Region })

  try {
    log.debug(`Add the function "${FunctionName}" permission "${Action}"`)
    const addPermission = retry(lambda, lambda.addPermission, Options.Defaults.override({ log }))
    await addPermission({
      FunctionName,
      Action,
      Principal,
      StatementId,
      SourceArn
    })
  } catch (error) {
    log.debug(`Failed to add the function "${FunctionName}" permission "${Action}"`)
    throw error
  }

  log.debug(`The the function "${FunctionName}" permission "${Action}" has been added`)
}

export default addFunctionPermission
