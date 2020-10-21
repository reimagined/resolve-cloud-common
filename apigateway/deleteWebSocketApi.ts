import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteWebSocketApi = async (
  params: {
    Region: string
    ApiId: string
    IfExists?: boolean
  },
  log: Log = getLog(`DELETE-WEBSOCKET-API`)
): Promise<void> => {
  const { Region, ApiId, IfExists } = params

  const apiGatewayV2 = new ApiGatewayV2({ region: Region })

  const deleteApi = retry(apiGatewayV2, apiGatewayV2.deleteApi, Options.Defaults.override({ log }))

  try {
    log.debug(`Delete the "${ApiId}" API`)

    await deleteApi({ ApiId })

    log.debug(`The websocket API has been deleted`)
  } catch (error) {
    if (IfExists) {
      ignoreNotFoundException(error)
    } else {
      log.error(`Failed to delete the websocket API`)
      throw error
    }
  }
}

export default deleteWebSocketApi
