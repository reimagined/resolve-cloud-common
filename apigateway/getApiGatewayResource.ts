import ApiGateway, { Resource } from 'aws-sdk/clients/apigateway'

import { retry, Options, getLog, Log } from '../utils'

const getApiGatewayResource = async (
  params: {
    Region: string
    RestApiId: string
    PathPart: string
  },
  log: Log = getLog(`GET-API-GATEWAY-RESOURCE`)
): Promise<string> => {
  const { Region, RestApiId, PathPart } = params

  const gw = new ApiGateway({ region: Region })

  try {
    log.debug(`Find a api gateway resource`)
    const getResources = retry(gw, gw.getResources, Options.Defaults.override({ log }))

    let position: string | undefined
    let resource: Resource | undefined

    do {
      const { position: nextPosition, items = [] } = await getResources({
        restApiId: RestApiId,
        position
      })

      resource = items.find((item) => item.pathPart === PathPart)

      if (resource != null) {
        break
      }

      position = nextPosition
    } while (position != null)

    if (resource == null || resource.id == null) {
      throw new Error('A resource not found')
    }

    log.debug(`The api gateway resource with id = "${resource.id}" has been found`)

    return resource.id
  } catch (error) {
    log.error(`Failed to a root api gateway resource`)
    throw error
  }
}

export default getApiGatewayResource
