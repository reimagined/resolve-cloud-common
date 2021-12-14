import ApiGatewayV2, { AuthorizationType, AuthorizationScopes, RouteParameters, UpdateApiResponse, Route } from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log } from '../utils'

import getRoute from './getRoute'

const updateRoute = async (
  params: {
    Region: string
    ApiId: string
    RouteId: string
    RouteKey: string
    AuthorizationType?: AuthorizationType
    AuthorizationScopes?: AuthorizationScopes
    ApiKeyRequired?: boolean
    RequestParameters?: RouteParameters
    Target?: string
  },
  log: Log = getLog('UPDATE-ROUTE')
): Promise<UpdateApiResponse | undefined> => {

  const {
    Region,
    ApiId,
    RouteId,
    RouteKey,
    ApiKeyRequired,
    AuthorizationScopes,
    AuthorizationType,
    RequestParameters,
    Target
  } = params

  const gateway = new ApiGatewayV2({ region: Region })

  const updateRouteExecutor = retry(
    gateway,
    gateway.updateRoute,
    Options.Defaults.override({log})
  )

  try {
    log.debug(`Update route "${RouteId}" on api gateway "${ApiId}"`)

    await updateRouteExecutor({
      ApiId,
      RouteId,
      RouteKey,
      ApiKeyRequired,
      AuthorizationScopes,
      AuthorizationType,
      RequestParameters,
      Target
    })

    const route = await getRoute({ApiId, Region, RouteKey})

    if (route) {
      log.debug(`Route "${RouteId}" on api gateway "${ApiId}" has been updated`)
      return route 
    } else {
      return undefined
    }
  } catch (error) {
    log.error(`Failed to update route "${RouteId}" on api gateway "${ApiId}"`)
    throw error
  }
}

export default updateRoute
