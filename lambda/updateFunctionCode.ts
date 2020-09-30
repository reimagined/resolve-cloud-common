import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const updateFunctionCode = async (
  params: {
    Region: string
    FunctionName: string
    S3Bucket: string
    S3Key: string
  },
  log: Log = getLog('UPDATE-FUNCTION-CODE')
): Promise<void> => {
  const { Region, FunctionName, S3Bucket, S3Key } = params

  try {
    log.debug(`Update the function "${FunctionName}" code`)

    const lambda = new Lambda({ region: Region })

    const setFunctionCode = retry(
      lambda,
      lambda.updateFunctionCode,
      Options.Defaults.override({ log, silent: true, maxAttempts: 1 })
    )
    await setFunctionCode({
      FunctionName,
      S3Bucket,
      S3Key
    })
    log.debug(`The function "${FunctionName}" code has been updated`)
  } catch (error) {
    log.debug(`Failed to update the function "${FunctionName}" code`)
    throw error
  }
}

export default updateFunctionCode
