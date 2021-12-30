import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log } from '../utils'

const createApiGatewayV2LambdaIntegration = async (
  params: {
    Region: string
    ApiId: string
    IntegrationType: 'AWS' | 'HTTP' | 'MOCK' | 'HTTP_PROXY' | 'AWS_PROXY'
    IntegrationUri?: string
    IntegrationMethod?: string
  },
  log: Log = getLog('CREATE-API-GATEWAY-V2-LAMBDA-INTEGRATION')
) => {
  const { Region, ApiId, IntegrationType, IntegrationUri, IntegrationMethod } = params
  const gateway = new ApiGatewayV2({ region: Region })

  const createApiGatewayV2LambdaIntegrationExecution = retry(
    gateway,
    gateway.createIntegration,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Create a api gateway lambda integration`)

    await createApiGatewayV2LambdaIntegrationExecution({
      ApiId,
      IntegrationType,
      IntegrationUri,
      IntegrationMethod
    })

    log.debug(`Lambda integration has been created`)
  } catch (error) {
    log.error(`Failed to create integration`)
    throw error
  }
}

export default createApiGatewayV2LambdaIntegration
