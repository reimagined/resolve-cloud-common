import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'

import createApiWithLambdaIntegration from './createApiWithLambdaIntegration'
import createRouteWithLambdaIntegration from './createRouteWithLambdaIntegration'
import { getLog, Log, Options, retry } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Stage: string
      Name: string
      ApiStage: string
      LambdaArn: string
      AccountId: string
    },
    log?: Log
  ): Promise<{ ApiId: string; ApiEndpoint: string }>
}

const ROUTES = ['/', '/{proxy+}']

const createHttpApi: TMethod = async (
  { Region, Stage, Name, ApiStage, LambdaArn, AccountId },
  log = getLog(`CREATE-HTTP-API`)
) => {
  const agv2 = new ApiGatewayV2({ region: Region })

  try {
    log.debug(`Create the "${Name}" HTTP API`)

    const { ApiId, ApiEndpoint, IntegrationId } = await createApiWithLambdaIntegration({
      Region,
      Name,
      ApiStage,
      LambdaArn,
      AccountId,
      ProtocolType: 'HTTP'
    })

    log.debug(`Create routes`)

    await Promise.all(
      ROUTES.map((path) =>
        createRouteWithLambdaIntegration(
          {
            Region,
            ApiId,
            IntegrationId,
            LambdaArn,
            AccountId,
            RouteKey: `ANY ${path}`,
            Path: path
          },
          log
        )
      )
    )

    log.debug(`Create deployment API`)

    const createDeployment = retry(agv2, agv2.createDeployment, Options.Defaults.override({ log }))

    await createDeployment({
      ApiId,
      StageName: ApiStage,
      Description: `resolve-api-http-${Stage}`
    })

    log.debug(`The HTTP API has been created`)
    return { ApiId, ApiEndpoint }
  } catch (error) {
    log.error(`Failed to create a HTTP API`)
    throw error
  }
}

export default createHttpApi
