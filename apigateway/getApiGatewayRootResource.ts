import APIGateway, { Resource } from 'aws-sdk/clients/apigateway'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      RestApiId: string
    },
    log?: Log
  ): Promise<string>
}

const getApiGatewayRootResource: TMethod = async (
  { Region, RestApiId },
  log = getLog(`GET-API-GATEWAY-ROOT-RESOURCE`)
) => {
  const gw = new APIGateway({ region: Region })

  try {
    log.debug(`Find a root api gateway resource`)
    const getResources = retry(gw, gw.getResources, Options.Defaults.override({ log }))

    let position: string | undefined
    let resource: Resource | undefined

    do {
      const { position: nextPosition, items = [] } = await getResources({
        restApiId: RestApiId,
        position
      })

      resource = items.find(item => item.parentId == null)

      if (resource != null) {
        break
      }

      position = nextPosition
    } while (position != null)

    if (resource == null || resource.id == null) {
      throw new Error('Root resource not found')
    }

    log.debug(`The root api gateway resource with id = "${resource.id}" has been found`)

    return resource.id
  } catch (error) {
    log.error(`Failed to find a root api gateway resource`)
    throw error
  }
}

export default getApiGatewayRootResource
