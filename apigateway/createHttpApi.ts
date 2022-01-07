import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log, ignoreAlreadyExistsException } from '../utils'

const createHttpApi = async (
  params: {
    Region: string
    Name: string
    ProtocolType: 'WEBSOCKET' | 'HTTP'
    Tags?: Record<string, string>
    IfNotExists?: boolean
  },
  log: Log = getLog('CREATE-HTTP-API')
): Promise<{ ApiId: string | undefined; ApiEndpoint: string | undefined; Name: string }> => {
  const { Region, Name, ProtocolType, IfNotExists, Tags = {} } = params

  const gateway = new ApiGatewayV2({ region: Region })
  const createHttpApiExecutor = retry(
    gateway,
    gateway.createApi,
    Options.Defaults.override({ log, expectedErrors: ['ConflictException', 'NotFoundException'] })
  )
  const getHttpApisExecutor = retry(
    gateway,
    gateway.getApis,
    Options.Defaults.override({ log, expectedErrors: ['NotFoundException'] })
  )

  let httpApiId: string | undefined
  let httpApiEndpoint: string | undefined
  try {
    log.debug(`Create the "${Name}" HTTP API`)

    void ({ ApiId: httpApiId, ApiEndpoint: httpApiEndpoint } = await createHttpApiExecutor({
      Name,
      ProtocolType,
      Tags
    }))
    log.debug(`The HTTP API has been created`)

    return { ApiId: httpApiId, ApiEndpoint: httpApiEndpoint, Name }
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

      return { ApiId: httpApiId, ApiEndpoint: httpApiEndpoint, Name }
    } else {
      log.error('Failed to create HTTP API')
      throw error
    }
  }
}

export default createHttpApi
