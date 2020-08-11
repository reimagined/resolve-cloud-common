import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Name: string
      RouteSelectionExpression: string
      Stage: string
      LambdaArn: string
    },
    log?: Log
  ): Promise<{ ApiId: string; ApiEndpoint: string; ApiKeySelectionExpression: string }>
}

const buildIntegrationUri = (region: string, lambdaArn: string): string =>
  `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`

const createWebSocketApi: TMethod = async (
  { Region, Name, RouteSelectionExpression, Stage, LambdaArn },
  log = getLog(`CREATE-WEBSOCKET-API`)
) => {
  const agv2 = new ApiGatewayV2({ region: Region })

  try {
    log.debug(`Create a websocket api "${Name}"`)

    const createApiExecutor = retry(agv2, agv2.createApi, Options.Defaults.override({ log }))
    const { ApiId, ApiEndpoint, ApiKeySelectionExpression } = await createApiExecutor({
      ProtocolType: 'WEBSOCKET',
      Name,
      RouteSelectionExpression
    })

    if (ApiId == null || ApiEndpoint == null || ApiKeySelectionExpression == null) {
      throw new Error('WebSocket API creation fault')
    }

    log.debug(`Create stage "${Stage}"`)
    const createStageExecutor = retry(agv2, agv2.createStage, Options.Defaults.override({ log }))
    await createStageExecutor({
      ApiId,
      StageName: Stage
    })

    log.debug(`Create lambda integration`)
    const createIntegrationExecutor = retry(
      agv2,
      agv2.createIntegration,
      Options.Defaults.override({ log })
    )

    const { IntegrationId: connectIntegrationId } = await createIntegrationExecutor({
      ApiId,
      IntegrationType: 'AWS',
      IntegrationUri: buildIntegrationUri(Region, LambdaArn)
    })

    log.debug(`Create route "$connect"`)
    const createRouteExecutor = retry(agv2, agv2.createRoute, Options.Defaults.override({ log }))
    await createRouteExecutor({
      ApiId,
      ApiKeyRequired: false,
      RouteKey: '$connect',
      Target: `integrations/${connectIntegrationId}`
    })

    log.debug(`Create route "$disconnect"`)
    await createRouteExecutor({
      ApiId,
      RouteKey: '$disconnect',
      Target: `integrations/${connectIntegrationId}`
    })

    log.debug(`Create route "$default"`)
    await createRouteExecutor({
      ApiId,
      RouteKey: '$default',
      Target: `integrations/${connectIntegrationId}`
    })

    log.debug(`Create deployment API`)
    const createDeploymentExecutor = retry(
      agv2,
      agv2.createDeployment,
      Options.Defaults.override({ log })
    )
    await createDeploymentExecutor({
      ApiId,
      StageName: Stage,
      Description: `resolve-api-websocket-${Stage}`
    })

    log.debug(`The WebSocket API has been created`)
    return { ApiId, ApiEndpoint, ApiKeySelectionExpression }
  } catch (error) {
    log.error(`Failed to create a WebSocket API`)
    throw error
  }
}

export default createWebSocketApi
