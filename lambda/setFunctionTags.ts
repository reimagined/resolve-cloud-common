import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const setFunctionTags = async (
  params: {
    Region: string
    FunctionName: string
    Tags: Record<string, string>
  },
  log: Log = getLog('SET-FUNCTION-TAGS')
): Promise<void> => {
  const { FunctionName, Region, Tags } = params

  const lambda = new Lambda({ region: Region })

  const tagResource = retry(
    lambda,
    lambda.tagResource,
    Options.Defaults.override({
      log,
      maxAttempts: 1,
      toleratedErrors: ['ResourceConflictException']
    })
  )

  try {
    log.debug(`Set the function tags ${JSON.stringify(Tags)}`)

    await tagResource({
      Resource: FunctionName,
      Tags
    })

    log.debug(`The function tags has been set`)
  } catch (error) {
    log.error(`Failed to set the function tags "${FunctionName}"`)
    throw error
  }
}

export default setFunctionTags
