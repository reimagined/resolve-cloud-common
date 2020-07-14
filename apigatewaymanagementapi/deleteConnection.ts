import Apigatewaymanagementapi from 'aws-sdk/clients/apigatewaymanagementapi'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      ConnectionId: string
    },
    log?: Log
  ): Promise<void>
}

const deleteConnection: TMethod = async (
  { Region, ConnectionId },
  log = getLog(`POST-TO-CONNECTION`)
) => {
  const managementApi = new Apigatewaymanagementapi({ region: Region })

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
