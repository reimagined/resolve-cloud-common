import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const getFunctionTags = async (
  params: {
    Region: string
    FunctionName: string
  },
  log: Log = getLog('GET-FUNCTION-TAGS')
): Promise<Record<string, string>> => {
  const { Region, FunctionName } = params

  try {
    log.debug(`Get the function "${FunctionName}" tags`)

    const lambda = new Lambda({ region: Region })

    const getFunction = retry(
      lambda,
      lambda.getFunction,
      Options.Defaults.override({ log, expectedErrors: ['ResourceNotFoundException'] })
    )
    const { Tags } = await getFunction({
      FunctionName
    })

    if (Tags == null) {
      throw new Error('Tags not found')
    }

    log.debug(`The function "${FunctionName}" tags has been got`)

    return Tags
  } catch (error) {
    log.debug(`Failed to get the function "${FunctionName}" tags`)
    throw error
  }
}

export default getFunctionTags
