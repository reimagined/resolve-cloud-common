import Lambda from 'aws-sdk/clients/lambda'

import getFunctionConfiguration from './getFunctionConfiguration'
import { retry, Options, getLog, Log } from '../utils'

const MAX_ATTEMPTS = 180
const ATTEMPT_TIMEOUT = 1000

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
      Options.Defaults.override({
        log,
        silent: true,
        maxAttempts: 1,
        toleratedErrors: ['ResourceConflictException']
      })
    )

    await setFunctionCode({
      FunctionName,
      S3Bucket,
      S3Key
    })

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      const { State, LastUpdateStatus } = await getFunctionConfiguration({
        Region,
        FunctionName
      })

      if (
        State != null &&
        State !== 'Pending' &&
        LastUpdateStatus != null &&
        LastUpdateStatus !== 'InProgress'
      ) {
        break
      }

      log.verbose(`Lambda is pending [${i}/${MAX_ATTEMPTS}]`)
      await new Promise((resolve) => setTimeout(resolve, ATTEMPT_TIMEOUT))
    }

    log.debug(`The function "${FunctionName}" code has been updated`)
  } catch (error) {
    log.debug(`Failed to update the function "${FunctionName}" code`)
    throw error
  }
}

export default updateFunctionCode
