import ApiGatewayV2, { Cors, UpdateApiResponse } from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log } from '../utils'

import getApi from './getApi'

const udpateApi = async (
  params: {
    Region: string
    ApiId: string
    Name: string
    ApiKeySelectionExpression?: string
    CorsConfiguration?: Cors
    CredentialsArn?: string
    Description?: string
    DisableExecuteApiEndpoint?: boolean
    DisableSchemaValidation?: boolean
    RouteKey?: string
    RouteSelectionExpression?: string
    Target?: string
    Version?: string
  },
  log: Log = getLog('UPDATE-API')
): Promise<UpdateApiResponse | undefined> => {
  const {
    Region,
    ApiId,
    Name,
    ApiKeySelectionExpression,
    CorsConfiguration,
    CredentialsArn,
    Description,
    DisableExecuteApiEndpoint,
    DisableSchemaValidation,
    RouteKey,
    RouteSelectionExpression,
    Target,
    Version
  } = params

  const gateway = new ApiGatewayV2({ region: Region })

  const udpateApiExecutor = retry(gateway, gateway.updateApi, Options.Defaults.override({ log }))

  try {
    log.debug(`Update api gateway "${ApiId}"`)
    console.log('111')
    await udpateApiExecutor({
      ApiId,
      Name,
      ApiKeySelectionExpression,
      CorsConfiguration,
      CredentialsArn,
      Description,
      DisableExecuteApiEndpoint,
      DisableSchemaValidation,
      RouteKey,
      RouteSelectionExpression,
      Target,
      Version
    })
    console.log('222')
    const api = await getApi({
      Region,
      Name
    })

    if (api) {
      log.debug(`Api gateway "${ApiId}" has been update`)
      return api
    } else {
      return undefined
    }
  } catch (error) {
    log.error(`Failed to update api gateway "${ApiId}"`)
    throw error
  }
}

export default udpateApi
