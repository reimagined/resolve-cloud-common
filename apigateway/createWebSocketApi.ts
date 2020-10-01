import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'

import createApiWithLambdaIntegration from './createApiWithLambdaIntegration'
import createRouteWithLambdaIntegration from './createRouteWithLambdaIntegration'

import { retry, Options, getLog, Log } from '../utils'

const ROUTES = ['$connect', '$disconnect', '$default']

const createWebSocketApi = async (
  params: {
    Region: string
    Stage: string
    Name: string
    RouteSelectionExpression: string
    ApiStage: string
    LambdaArn: string
    AccountId: string
  },
  log: Log = getLog(`CREATE-WEBSOCKET-API`)
): Promise<{ ApiId: string; ApiEndpoint: string }> => {
  const { Region, Stage, Name, RouteSelectionExpression, ApiStage, LambdaArn, AccountId } = params

  const agv2 = new ApiGatewayV2({ region: Region })

  try {
    log.debug(`Create a websocket api "${Name}"`)

    const { ApiId, ApiEndpoint, IntegrationId } = await createApiWithLambdaIntegration({
      Region,
      Name,
      AccountId,
      ApiStage,
      LambdaArn,
      RouteSelectionExpression,
      ProtocolType: 'WEBSOCKET'
    })

    log.debug(`Create routes`)

    await Promise.all(
      ROUTES.map((routeKey) =>
        createRouteWithLambdaIntegration(
          {
            Region,
            ApiId,
            IntegrationId,
            LambdaArn,
            AccountId,
            RouteKey: routeKey,
            Path: routeKey
          },
          log
        )
      )
    )

    log.debug(`Routes created`)

    log.debug(`Create deployment API`)
    const createDeploymentExecutor = retry(
      agv2,
      agv2.createDeployment,
      Options.Defaults.override({ log })
    )
    await createDeploymentExecutor({
      ApiId,
      StageName: ApiStage,
      Description: `resolve-api-websocket-${Stage}`
    })

    log.debug(`The WebSocket API has been created`)
    return { ApiId, ApiEndpoint }
  } catch (error) {
    log.error(`Failed to create a WebSocket API`)
    throw error
  }
}

export default createWebSocketApi
