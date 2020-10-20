import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'

import { getLog, Log, Options, retry } from '../utils'

const buildIntegrationUri = (region: string, lambdaArn: string): string =>
  `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`

const createApiWithLambdaIntegration = async (
  params: {
    Region: string
    Name: string
    ApiStage: string
    LambdaArn: string
    AccountId: string
    ProtocolType: 'HTTP' | 'WEBSOCKET'
    RouteSelectionExpression?: string
    Tags?: Record<string, string>
  },
  log: Log = getLog(`CREATE-API-WITH-LAMBDA-INTEGRATION`)
): Promise<{ ApiId: string; ApiEndpoint: string; IntegrationId: string }> => {
  const { Region, Name, ApiStage, LambdaArn, ProtocolType, RouteSelectionExpression, Tags } = params

  const agv2 = new ApiGatewayV2({ region: Region })

  try {
    log.debug(`Create an "${Name}" API`)

    const createApiExecutor = retry(agv2, agv2.createApi, Options.Defaults.override({ log }))

    const { ApiId, ApiEndpoint } = await createApiExecutor({
      ProtocolType,
      Name,
      RouteSelectionExpression,
      Tags
    })

    if (ApiId == null || ApiEndpoint == null) {
      throw new Error('API creation fault')
    }

    log.debug(`Create "${ApiStage}" stage`)

    const createStageExecutor = retry(agv2, agv2.createStage, Options.Defaults.override({ log }))

    await createStageExecutor({
      ApiId,
      StageName: ApiStage
    })

    log.debug(`Create lambda integration`)

    const createIntegration = retry(
      agv2,
      agv2.createIntegration,
      Options.Defaults.override({ log })
    )

    const { IntegrationId } = await createIntegration({
      ApiId,
      IntegrationMethod: 'POST',
      IntegrationType: 'AWS_PROXY',
      IntegrationUri: buildIntegrationUri(Region, LambdaArn),
      PayloadFormatVersion: '2.0'
    })

    if (IntegrationId == null) {
      throw new Error(`The "IntegrationId" field is absent`)
    }

    return { ApiId, ApiEndpoint, IntegrationId }
  } catch (error) {
    log.error(`Failed to create API`)
    throw error
  }
}

export default createApiWithLambdaIntegration
