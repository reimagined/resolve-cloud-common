import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const getFunctionRole = async (
  params: {
    Region: string
    FunctionName: string
  },
  log: Log = getLog('GET-FUNCTION-ROLE')
): Promise<string> => {
  const { Region, FunctionName } = params

  try {
    log.debug(`Get the function "${FunctionName}" role`)

    const lambda = new Lambda({ region: Region })

    const getFunctionConfiguration = retry(
      lambda,
      lambda.getFunctionConfiguration,
      Options.Defaults.override({ log, expectedErrors: ['ResourceNotFoundException'] })
    )
    const { Role: RoleArn } = await getFunctionConfiguration({
      FunctionName
    })

    if (RoleArn == null) {
      throw new Error('Role not found')
    }

    log.debug(`The function "${FunctionName}" role arn has been got`)

    return RoleArn
  } catch (error) {
    log.debug(`Failed to get the function "${FunctionName}" role`)
    throw error
  }
}

export default getFunctionRole
