import ApiGateway from 'aws-sdk/clients/apigateway'

import { retry, Options, getLog, Log } from '../utils'

const createApiGatewayMethod = async (
  params: {
    Region: string
    RestApiId: string
    ResourceId: string
  },
  log: Log = getLog(`CREATE-API-GATEWAY`)
): Promise<void> => {
  const { Region, RestApiId, ResourceId } = params

  const gw = new ApiGateway({ region: Region })

  try {
    log.debug(`Create a rest api "${RestApiId}" http method "ANY"`)

    const putMethod = retry(gw, gw.putMethod, Options.Defaults.override({ log }))
    await putMethod({
      restApiId: RestApiId,
      resourceId: ResourceId,
      httpMethod: 'ANY',
      authorizationType: 'AWS_IAM'
    })

    log.debug(`The rest api http method "ANY" has been created`)
  } catch (error) {
    log.error(`Failed to create a rest api http method "ANY"`)
    throw error
  }
}

export default createApiGatewayMethod
