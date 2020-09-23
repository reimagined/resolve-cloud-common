import ApiGateway from 'aws-sdk/clients/apigateway'

import { retry, Options, getLog, Log, ignoreAlreadyExistsException } from '../utils'

const createRestApi = async (
  params: {
    Region: string
    Name: string
    Tags?: Record<string, string>
    IfNotExists?: boolean
  },
  log: Log = getLog(`CREATE-REST-API`)
): Promise<{ Id?: string; Name: string }> => {
  const { Region, Name, Tags, IfNotExists } = params

  const gateway = new ApiGateway({ region: Region })

  const createApiExecutor = retry(
    gateway,
    gateway.createRestApi,
    Options.Defaults.override({ log })
  )

  const getApisExecutor = retry(gateway, gateway.getRestApis, Options.Defaults.override({ log }))

  let restApiId: string | undefined
  try {
    log.debug(`Create the "${Name}" Rest API`)

    void ({ id: restApiId } = await createApiExecutor({
      name: Name,
      endpointConfiguration: {
        types: ['REGIONAL']
      },
      tags: Tags
    }))

    log.debug(`The Rest API has been created`)
    return { Id: restApiId, Name }
  } catch (error) {
    if (IfNotExists) {
      log.error(`Skip create the Rest API`)
      ignoreAlreadyExistsException(error)

      let position: string | undefined
      searchLoop: for (;;) {
        const { items, position: nextPosition } = await getApisExecutor({ limit: 50, position })
        if (items == null || items.length === 0 || nextPosition == null || nextPosition === '') {
          break searchLoop
        }
        for (const { name, id } of items) {
          if (name === Name) {
            restApiId = id
            break searchLoop
          }
        }

        position = nextPosition
      }

      return { Id: restApiId, Name }
    } else {
      log.error(`Failed to create the Rest API`)
      throw error
    }
  }
}

export default createRestApi
