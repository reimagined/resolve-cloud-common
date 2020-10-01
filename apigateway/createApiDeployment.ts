import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'

import { getLog, Log, Options, retry } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Stage: string
      ApiId: string
      ApiStage: string
    },
    log?: Log
  ): Promise<void>
}

const createApiDeployment: TMethod = async (
  { Region, Stage, ApiId, ApiStage },
  log = getLog(`CREATE-HTTP-API`)
) => {
  const agv2 = new ApiGatewayV2({ region: Region })

  try {
    log.debug(`Create deployment API`)

    const createDeployment = retry(agv2, agv2.createDeployment, Options.Defaults.override({ log }))

    await createDeployment({
      ApiId,
      StageName: ApiStage,
      Description: `resolve-api-http-${Stage}`
    })

    log.debug(`The API deployment has been created`)
  } catch (error) {
    log.error(`Failed to create an API deployment`)
    throw error
  }
}

export default createApiDeployment
