import ApiGateway from 'aws-sdk/clients/apigateway'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Name: string
    },
    log?: Log
  ): Promise<{ Id?: string; Name: string }>
}

const createRestApi: TMethod = async ({ Region, Name }, log = getLog(`CREATE-REST-API`)) => {
  const gateway = new ApiGateway({ region: Region })

  const createApiExecutor = retry(
    gateway,
    gateway.createRestApi,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Create the "${Name}" Rest API`)

    const { id: restApiId } = await createApiExecutor({
      name: Name,
      endpointConfiguration: {
        types: ['REGIONAL']
      }
    })

    log.debug(`The Rest API has been created`)
    return { Id: restApiId, Name }
  } catch (e) {
    log.error(`Failed to create the Rest API`)
    throw e
  }
}

export default createRestApi
