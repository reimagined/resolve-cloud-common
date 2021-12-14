import ApiGatewayV2, { ProtocolType, CreateApiResponse } from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log, ignoreAlreadyExistsException } from '../utils'

const createHttpApi = async (
  params: {
    Region: string
    Name: string
    ProtocolType: ProtocolType
    Tags?: Record<string, string>
    IfNotExists?: boolean
  },
  log: Log = getLog('CREATE-HTTP-API')
): Promise<{ ID: string | undefined, Name: string }> => {
  const { Region, Name, ProtocolType, IfNotExists, Tags } = params

  const gateway = new ApiGatewayV2({ region: Region })
  const createHttpApiExecutor = retry(
    gateway,
    gateway.createApi,
    Options.Defaults.override({ log })
  )

  const getHttpApisExecutor = retry(gateway, gateway.getApis, Options.Defaults.override({ log }))

  let httpApiId: string | undefined
  try {
    log.debug(`Create the "${Name}" HTTP API`)

    void ({ ApiId: httpApiId } = await createHttpApiExecutor({
      Name,
      ProtocolType,
      Tags
    }))
    log.debug(`The HTTP API has been created`)

    return { ID: httpApiId, Name }
  } catch (error) {
    if (IfNotExists) {
      log.error(`Skip create the HTTP API`)
      ignoreAlreadyExistsException(error)

      let NextToken: string | undefined
      searchLoop: for (;;) {
        const { Items, NextToken: token } = await getHttpApisExecutor({
          MaxResults: '50',
          NextToken
        })

        if (Items != null) {
          for (const { Name: name, ApiId: id } of Items) {
            if (name === Name) {
              httpApiId = id
              break searchLoop
            }
          }
        }

        if (Items == null || Items.length === 0 || token == null || token === '') {
          break searchLoop
        }

        NextToken = token
      }

      return { ID: httpApiId, Name }
    } else {
      log.error('Failed to create HTTP API')
      throw error
    }
  }
}

export default createHttpApi
