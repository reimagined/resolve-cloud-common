import ApiGateway, { RestApi } from 'aws-sdk/clients/apigateway'
import Resourcegroupstaggingapi from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteRestApi = async (
  params: {
    Region: string
    Name: string
    IfExists?: boolean
  },
  log: Log = getLog(`DELETE-REST-API`)
): Promise<void> => {
  const { Region, Name, IfExists } = params

  const gateway = new ApiGateway({ region: Region })
  const taggingApi = new Resourcegroupstaggingapi({ region: Region })

  const deleteRestApiExecutor = retry(
    gateway,
    gateway.deleteRestApi,
    Options.Defaults.override({ log })
  )
  const getApisExecutor = retry(gateway, gateway.getRestApis, Options.Defaults.override({ log }))
  const untagResourcesExecutor = retry(
    taggingApi,
    taggingApi.untagResources,
    Options.Defaults.override({ log })
  )

  let restApi: RestApi | undefined
  try {
    log.debug(`Delete the "${Name}" Rest API`)

    let position: string | undefined
    searchLoop: for (;;) {
      const { items, position: nextPosition } = await getApisExecutor({ limit: 50, position })

      if (items != null) {
        for (const item of items) {
          if (item.name === Name) {
            restApi = item
            break searchLoop
          }
        }
      }

      if (items == null || items.length === 0 || nextPosition == null || nextPosition === '') {
        break searchLoop
      }

      position = nextPosition
    }
    if (restApi == null || restApi.id == null) {
      const error: Error & { code?: string } = new Error('Rest api not found')
      error.code = 'ResourceNotFoundException'
      throw error
    }

    try {
      if (restApi.tags != null) {
        await untagResourcesExecutor({
          ResourceARNList: [`arn:aws:apigateway:${Region}::/restapis/${restApi.id}`],
          TagKeys: Object.keys(restApi.tags)
        })
      }
    } catch (error) {
      log.warn(error)
    }

    await deleteRestApiExecutor({
      restApiId: restApi.id
    })

    log.debug(`The Rest API has been deleted`)
  } catch (error) {
    if (IfExists) {
      ignoreNotFoundException(error)
    } else {
      log.error(`Failed to delete the Rest API`)
      throw error
    }
  }
}

export default deleteRestApi
