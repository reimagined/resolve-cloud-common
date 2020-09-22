import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'
import Lambda from 'aws-sdk/clients/lambda'
import * as uuid from 'uuid'

import { getLog, Log, Options, retry } from '../utils'

interface TMethod {
  (
    params: {
      ApiId: string
      RouteKey: string
      Path: string
      IntegrationId: string
      Region: string
      LambdaArn: string
      AccountId: string
    },
    log?: Log
  ): Promise<void>
}

const buildExecuteApiArn = (
  region: string,
  accountId: string,
  apiId: string,
  path: string
): string => `arn:aws:execute-api:${region}:${accountId}:${apiId}/*/*${path}`

const createRouteWithLambdaIntegration: TMethod = async (
  { ApiId, RouteKey, IntegrationId, LambdaArn, AccountId, Region, Path },
  log = getLog(`CREATE-ROUTE-WITH-LAMBDA-INTEGRATION`)
) => {
  const agv2 = new ApiGatewayV2({ region: Region })
  const lambda = new Lambda({ region: Region })

  const createRoute = retry(agv2, agv2.createRoute, Options.Defaults.override({ log }))
  const addPermission = retry(lambda, lambda.addPermission, Options.Defaults.override({ log }))

  log.debug(`Create route "${RouteKey}"`)

  await createRoute({
    ApiId,
    ApiKeyRequired: false,
    RouteKey,
    Target: `integrations/${IntegrationId}`
  })

  log.debug(`Add lambda permissions for "${Path}" API route`)

  await addPermission({
    FunctionName: LambdaArn,
    StatementId: uuid.v4(),
    Action: 'lambda:InvokeFunction',
    Principal: 'apigateway.amazonaws.com',
    SourceArn: buildExecuteApiArn(Region, AccountId, ApiId, Path)
  })
}

export default createRouteWithLambdaIntegration
