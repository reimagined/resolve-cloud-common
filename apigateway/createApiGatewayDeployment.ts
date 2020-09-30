import ApiGateway from 'aws-sdk/clients/apigateway'

import { retry, Options, getLog, Log } from '../utils'

const createApiGatewayDeployment = async (
  params: {
    Region: string
    RestApiId: string
    Stage: string
    Description?: string
  },
  log: Log = getLog(`CREATE-API-GATEWAY-DEPLOYMENT`)
): Promise<void> => {
  const { Region, RestApiId, Stage, Description } = params

  const gw = new ApiGateway({ region: Region })

  try {
    log.debug(`Create a api gateway "${RestApiId}" deployment on the stage "${Stage}"`)

    const createDeployment = retry(gw, gw.createDeployment, Options.Defaults.override({ log }))
    await createDeployment({
      restApiId: RestApiId,
      stageName: Stage,
      description: Description
    })

    log.debug(`The api gateway "${RestApiId}" deployment on the stage "${Stage}" has been created`)
  } catch (error) {
    log.error(`Failed to create a api gateway "${RestApiId}" deployment on the stage "${Stage}"`)
    throw error
  }
}

export default createApiGatewayDeployment
