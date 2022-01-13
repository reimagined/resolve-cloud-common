import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const deleteFunctionTags = async (
  params: {
    Region: string
    FunctionName: string
    TagKeys: Array<string>
  },
  log: Log = getLog('DELETE-FUNCTION-TAGS')
): Promise<void> => {
  const { FunctionName, Region, TagKeys } = params

  const lambda = new Lambda({ region: Region })

  const untagResource = retry(
    lambda,
    lambda.untagResource,
    Options.Defaults.override({
      log,
      maxAttempts: 1,
      toleratedErrors: ['ResourceConflictException']
    })
  )

  try {
    log.debug(`Delete the function tags ${TagKeys}`)

    await untagResource({
      Resource: FunctionName,
      TagKeys
    })

    log.debug(`Function tags "${FunctionName}" has been deleted`)
  } catch (error) {
    log.error(`Failed to delete the function tags "${FunctionName}"`)
    throw error
  }
}

export default deleteFunctionTags
