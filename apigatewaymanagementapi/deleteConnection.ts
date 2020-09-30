import Apigatewaymanagementapi from 'aws-sdk/clients/apigatewaymanagementapi'

import { retry, Options, getLog, Log } from '../utils'

const deleteConnection = async (
  params: {
    Endpoint: string
    ConnectionId: string
  },
  log: Log = getLog(`POST-TO-CONNECTION`)
): Promise<void> => {
  const { Endpoint, ConnectionId } = params

  const managementApi = new Apigatewaymanagementapi({ endpoint: Endpoint })

  try {
    log.debug(`Delete connection "${ConnectionId}"`)

    const deleteConnectionExecutor = retry(
      managementApi,
      managementApi.deleteConnection,
      Options.Defaults.override({ log })
    )
    await deleteConnectionExecutor({ ConnectionId })
  } catch (error) {
    log.error(`Failed to delete connection "${ConnectionId}"`)
    throw error
  }
}

export default deleteConnection
