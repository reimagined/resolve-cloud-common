import ApiGateway from 'aws-sdk/clients/apigateway'

import { retry, Options, getLog, Log } from '../utils'

const createApiGatewayResource = async (
  params: {
    Region: string
    RestApiId: string
    ParentId: string
    PathPart: string
  },
  log: Log = getLog(`CREATE-API-GATEWAY-RESOURCE`)
): Promise<string> => {
  const { Region, RestApiId, ParentId, PathPart } = params

  const gw = new ApiGateway({ region: Region })

  try {
    log.debug(`Create the rest api "${RestApiId}" resource "${PathPart}"`)

    const createResource = retry(gw, gw.createResource, Options.Defaults.override({ log }))
    const { id } = await createResource({
      restApiId: RestApiId,
      parentId: ParentId,
      pathPart: PathPart
    })

    if (id == null) {
      throw new Error(`Unknown resource id`)
    }

    log.debug(`The rest api resource "${id}" has been created`)

    return id
  } catch (error) {
    log.error(`Failed to create the rest api "${RestApiId}" resource "${PathPart}"`)
    throw error
  }
}

export default createApiGatewayResource
