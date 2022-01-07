import ApiGatewayV2, {
  AuthorizationType as TypeOfAuthorization,
  AuthorizationScopes as TypeOfAuthorizationScopes,
  RouteParameters
} from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log } from '../utils'

const createRoute = async (
  params: {
    Region: string
    ApiId: string
    RouteKey: string
    AuthorizationType?: TypeOfAuthorization
    AuthorizationScopes?: TypeOfAuthorizationScopes
    ApiKeyRequired?: boolean
    RequestParameters?: RouteParameters
    Target?: string
  },
  log: Log = getLog('CREATE-ROUTE')
): Promise<string | undefined> => {
  const {
    Region,
    ApiId,
    RouteKey,
    ApiKeyRequired,
    AuthorizationScopes,
    AuthorizationType,
    RequestParameters,
    Target
  } = params

  const gateway = new ApiGatewayV2({ region: Region })

  const createRouteExecutor = retry(
    gateway,
    gateway.createRoute,
    Options.Defaults.override({ log, expectedErrors: ['ConflictException', 'NotFoundException'] })
  )

  try {
    log.debug(`Create route for API Gateway ID "${ApiId}"`)

    const { RouteId } = await createRouteExecutor({
      ApiId,
      RouteKey,
      ApiKeyRequired,
      AuthorizationScopes,
      AuthorizationType,
      RequestParameters,
      Target
    })

    log.debug(`Route "${RouteKey}" has been created with ID "${RouteId}"`)

    return RouteId
  } catch (error) {
    log.error(`Failed to create route "${RouteKey}" for "${ApiId}"`)
    throw error
  }
}

export default createRoute
