import type { LayerList } from 'aws-sdk/clients/lambda'

import updateFunctionConfiguration from './updateFunctionConfiguration'
import { getLog, Log } from '../utils'

const updateFunctionLayers = async (
  params: {
    Region: string
    FunctionName: string
    Layers: LayerList
  },
  log: Log = getLog('UPDATE-FUNCTION-LAYERS')
): Promise<void> => {
  const { Region, FunctionName, Layers } = params

  try {
    log.debug(`Update the function "${FunctionName}" layers`)

    await updateFunctionConfiguration({
      Region,
      FunctionName,
      Layers
    })

    log.debug(`The function "${FunctionName}" layers has been updated`)
  } catch (error) {
    log.debug(`Failed to update the function "${FunctionName}" layers`)
    throw error
  }
}

export default updateFunctionLayers
