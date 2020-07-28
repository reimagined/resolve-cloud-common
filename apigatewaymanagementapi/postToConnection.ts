import Apigatewaymanagementapi from 'aws-sdk/clients/apigatewaymanagementapi'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Endpoint: string
      ConnectionId: string
      Data: string
    },
    log?: Log
  ): Promise<void>
}

const postToConnection: TMethod = async (
  { Endpoint, ConnectionId, Data },
  log = getLog(`POST-TO-CONNECTION`)
) => {
  const managementApi = new Apigatewaymanagementapi({ endpoint: Endpoint })

  try {
    log.debug(`Post data to connection "${ConnectionId}"`)

    const postToConnectionExecutor = retry(
      managementApi,
      managementApi.postToConnection,
      Options.Defaults.override({ log })
    )
    await postToConnectionExecutor({ ConnectionId, Data })
  } catch (error) {
    log.error(`Failed post data to connection "${ConnectionId}"`)
    throw error
  }
}

export default postToConnection