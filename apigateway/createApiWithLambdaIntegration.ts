import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'

import { getLog, Log, Options, retry } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Name: string
      ApiStage: string
      LambdaArn: string
      AccountId: string
      ProtocolType: 'HTTP' | 'WEBSOCKET'
      RouteSelectionExpression?: string
    },
    log?: Log
  ): Promise<{ ApiId: string; ApiEndpoint: string; IntegrationId: string }>
}

const buildIntegrationUri = (region: string, lambdaArn: string): string =>
  `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`

const createApiWithLambdaIntegration: TMethod = async (
  { Region, Name, ApiStage, LambdaArn, ProtocolType, RouteSelectionExpression },
  log = getLog(`CREATE-API-WITH-LAMBDA-INTEGRATION`)
) => {
  const agv2 = new ApiGatewayV2({ region: Region })

  try {
    log.debug(`Create an "${Name}" API`)

    const createApiExecutor = retry(agv2, agv2.createApi, Options.Defaults.override({ log }))

    const { ApiId, ApiEndpoint } = await createApiExecutor({
      ProtocolType,
      Name,
      RouteSelectionExpression
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

    const { IntegrationId = '' } = await createIntegration({
      ApiId,
      IntegrationMethod: 'POST',
      IntegrationType: 'AWS_PROXY',
      IntegrationUri: buildIntegrationUri(Region, LambdaArn),
      PayloadFormatVersion: '2.0'
    })

    return { ApiId, ApiEndpoint, IntegrationId }
  } catch (e) {
    log.error(`Failed to create API`)
    throw e
  }
}

export default createApiWithLambdaIntegration
