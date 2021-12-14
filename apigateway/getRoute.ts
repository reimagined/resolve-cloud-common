import ApiGatewayV2, { Route } from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log } from '../utils'

const getRoute = async (
  params: {
    Region: string
    ApiId: string
    RouteKey: string
  },
  log: Log = getLog('GET-ROUTE')
): Promise<ApiGatewayV2.Route | null> => {
  const { Region, ApiId, RouteKey } = params

  const gateway = new ApiGatewayV2({ region: Region })

  const getRouteExecutor = retry(
    gateway,
    gateway.getRoutes,
    Options.Defaults.override({log})
  )
  let nextToken: string | undefined
  let items: Route[] | undefined

  do {
    try {
      log.debug(`Find a api gateway route`)
  
      void({ NextToken: nextToken, Items: items } = await getRouteExecutor({
        ApiId,
        MaxResults: '100',
        NextToken: nextToken
      }))

      const route = items?.find(
        (item) => item.RouteKey === RouteKey
      )

      if (route) {
        return route
      }
    } catch (error) {
      log.error(`Failed to get route from api gateway "${ApiId}"`)
      throw error
    }
  } while (nextToken != null)
  
  return null
}

export default getRoute
