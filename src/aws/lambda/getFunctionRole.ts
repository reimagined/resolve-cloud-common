import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../../utils'

interface TMethod {
  (
    params: {
      Region: string
      FunctionName: string
    },
    log?: Log
  ): Promise<string>
}

const getFunctionRole: TMethod = async (
  { Region, FunctionName },
  log: Log = getLog('GET-FUNCTION-ROLE')
) => {
  try {
    log.debug(`Get the function "${FunctionName}" role`)

    const lambda = new Lambda({ region: Region })

    const getFunctionConfiguration = retry(
      lambda,
      lambda.getFunctionConfiguration,
      Options.Defaults.override({ log, maxAttempts: 1 })
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
