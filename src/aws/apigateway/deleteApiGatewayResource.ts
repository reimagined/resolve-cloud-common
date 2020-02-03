import APIGateway from 'aws-sdk/clients/apigateway'

import { retry, Options, getLog, Log } from '../../utils'

interface TMethod {
  (
    params: {
      Region: string
      RestApiId: string
      ResourceId: string
    },
    log?: Log
  ): Promise<void>
}

const deleteApiGatewayResource: TMethod = async (
  { Region, RestApiId, ResourceId },
  log = getLog(`DELETE-API-GATEWAY-RESOURCE`)
) => {
  const gw = new APIGateway({ region: Region })

  try {
    log.debug(`Delete the rest api "${RestApiId}" resource "${ResourceId}"`)

    const deleteResource = retry(gw, gw.deleteResource, Options.Defaults.override({ log }))
    await deleteResource({
      restApiId: RestApiId,
      resourceId: ResourceId
    })

    log.debug(`The rest api "${RestApiId}" resource "${ResourceId}" has been deleted`)
  } catch (error) {
    log.error(`Failed to delete the rest api "${RestApiId}" resource "${ResourceId}"`)
    throw error
  }
}

export default deleteApiGatewayResource
