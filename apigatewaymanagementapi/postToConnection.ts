import Apigatewaymanagementapi from 'aws-sdk/clients/apigatewaymanagementapi'

import { retry, Options, getLog, Log } from '../utils'

const postToConnection = async (
  params: {
    Endpoint: string
    ConnectionId: string
    Data: string
  },
  log: Log = getLog(`POST-TO-CONNECTION`)
): Promise<void> => {
  const { Endpoint, ConnectionId, Data } = params

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
