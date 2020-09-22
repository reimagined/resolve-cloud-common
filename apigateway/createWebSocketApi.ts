import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log, ignoreAlreadyExistsException } from '../utils'

const buildIntegrationUri = (region: string, lambdaArn: string): string =>
  `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`

const createWebSocketApi = async (
  params: {
    Region: string
    Name: string
    RouteSelectionExpression: string
    Stage: string
    LambdaArn: string
    Tags?: Record<string, string>
    IfNotExists?: boolean
  },
  log: Log = getLog(`CREATE-WEBSOCKET-API`)
): Promise<{ ApiId: string; ApiEndpoint: string; ApiKeySelectionExpression: string }> => {
  const { Region, Name, RouteSelectionExpression, Stage, LambdaArn, Tags, IfNotExists } = params
  const agv2 = new ApiGatewayV2({ region: Region })

  try {
    log.debug(`Create a websocket api "${Name}"`)

    const createApiExecutor = retry(agv2, agv2.createApi, Options.Defaults.override({ log }))
    const getApisExecutor = retry(agv2, agv2.getApis, Options.Defaults.override({ log }))

    let ApiId, ApiEndpoint, ApiKeySelectionExpression

    try {
      void ({ ApiId, ApiEndpoint, ApiKeySelectionExpression } = await createApiExecutor({
        ProtocolType: 'WEBSOCKET',
        Name,
        RouteSelectionExpression,
        Tags
      }))
    } catch (error) {
      if(IfNotExists) {
        log.error(`Skip create the WebSocket API`)
        ignoreAlreadyExistsException(error)

        let NextToken: string | undefined
        searchLoop: while(true) {
          const { Items, NextToken: followingNextToken } = await getApisExecutor({ MaxResults: '50', NextToken })
          if(Items == null || Items.length === 0 || followingNextToken == null || followingNextToken === '') {
            break searchLoop
          }
          for(const { Name: ItemName, ApiId: ItemApiId, ApiEndpoint: ItemApiEndpoint, ApiKeySelectionExpression: ItemApiKeySelectionExpression } of Items) {
            if(ItemName === Name) {
              ApiId = ItemApiId
              ApiEndpoint = ItemApiEndpoint
              ApiKeySelectionExpression = ItemApiKeySelectionExpression
              break searchLoop
            }
          }

          NextToken = followingNextToken
        }

        return { ApiId, ApiEndpoint, ApiKeySelectionExpression }
      } else {
        log.error(`Failed to create the Rest API`)
        throw error
      }
    }

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
      IntegrationType: 'AWS_PROXY',
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
