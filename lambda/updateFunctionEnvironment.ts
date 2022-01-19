import updateFunctionConfiguration from './updateFunctionConfiguration'
import { getLog, Log } from '../utils'

const updateFunctionEnvironment = async (
  params: {
    Region: string
    FunctionName: string
    Variables: {
      [key: string]: string | null
    }
  },
  log: Log = getLog('UPDATE-LAMBDA-ENVIRONMENT')
): Promise<void> => {
  const { Region, FunctionName, Variables } = params

  try {
    log.debug(`Update function environment variables`)

    await updateFunctionConfiguration({
      Region,
      FunctionName,
      Variables,
    })
  } catch (error) {
    log.debug(`Failed to update function environment variables`)
    throw error
  }

  log.debug(`Function environment variables have been updated`)
}

export default updateFunctionEnvironment
