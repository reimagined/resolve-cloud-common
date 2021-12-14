import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteRoute = async(
  params: {
    Region: string
    ApiId: string
    RouteId: string
    IfExists?: boolean
  },
  log: Log = getLog('DELETE-ROUTE')
): Promise<void> => {
  const { Region, ApiId, RouteId, IfExists } = params

  const gateway = new ApiGatewayV2({ region: Region })
  
  const deleteRouteExecutor = retry(
    gateway,
    gateway.deleteRoute,
    Options.Defaults.override({log})
  )

  try {
    log.debug(`Delete the route "${RouteId}"`)

    await deleteRouteExecutor({
      ApiId,
      RouteId
    })

    log.debug(`The route "${RouteId}" has been deleted`)
  } catch (error) {
    if (IfExists){
      ignoreNotFoundException(error)
    } else {
      log.error(`Failed to delete the route "${RouteId}"`)
      throw error
    }
  }
}

export default deleteRoute
