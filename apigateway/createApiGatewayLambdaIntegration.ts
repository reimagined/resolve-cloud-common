import ApiGateway from 'aws-sdk/clients/apigateway'

import { retry, Options, getLog, Log } from '../utils'

const createApiGatewayLambdaIntegration = async (
  params: {
    Region: string
    RestApiId: string
    ResourceId: string
    URI: string
  },
  log: Log = getLog(`CREATE-API-GATEWAY-LAMBDA-INTEGRATION`)
): Promise<void> => {
  const { Region, RestApiId, ResourceId, URI } = params

  const gw = new ApiGateway({ region: Region })

  try {
    log.debug(`Create a api gateway lambda integration`)

    const putIntegration = retry(gw, gw.putIntegration, Options.Defaults.override({ log }))
    await putIntegration({
      restApiId: RestApiId,
      resourceId: ResourceId,
      uri: URI,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      httpMethod: 'ANY'
    })

    log.debug(`The api gateway lambda integration has been created`)
  } catch (error) {
    log.error(`Failed to create a api gateway lambda integration`)
    throw error
  }
}

export default createApiGatewayLambdaIntegration
