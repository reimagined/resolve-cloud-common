import ApiGateway from 'aws-sdk/clients/apigateway'

import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteApiGatewayResource = async (
  params: {
    Region: string
    RestApiId: string
    ResourceId: string
    IfExists?: boolean
  },
  log: Log = getLog(`DELETE-API-GATEWAY-RESOURCE`)
): Promise<void> => {
  const { Region, RestApiId, ResourceId, IfExists } = params

  const gw = new ApiGateway({ region: Region })

  try {
    log.debug(`Delete the rest api "${RestApiId}" resource "${ResourceId}"`)

    const deleteResource = retry(gw, gw.deleteResource, Options.Defaults.override({ log }))
    await deleteResource({
      restApiId: RestApiId,
      resourceId: ResourceId
    })

    log.debug(`The rest api "${RestApiId}" resource "${ResourceId}" has been deleted`)
  } catch (error) {
    if (IfExists) {
      log.error(`Skip delete the rest api "${RestApiId}" resource "${ResourceId}"`)
      ignoreNotFoundException(error)
    } else {
      log.error(`Failed to delete the rest api "${RestApiId}" resource "${ResourceId}"`)
      throw error
    }
  }
}

export default deleteApiGatewayResource
