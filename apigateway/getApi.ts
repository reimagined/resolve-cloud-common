import ApiGatewayV2, { Api, ProtocolType } from 'aws-sdk/clients/apigatewayv2'

import { Log, Options, retry } from '../utils'
import { getLog } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Name: string
      ProtocolType?: ProtocolType
    },
    log?: Log
  ): Promise<Api | null>
}

const getApi: TMethod = async ({ Region, Name, ProtocolType: Protocol }, log = getLog('GET_API')) => {
  let nextToken
  let items

  const gateway = new ApiGatewayV2({ region: Region })

  const getRestApis = retry(gateway, gateway.getApis, Options.Defaults.override({ log }))

  do {
    ;({ NextToken: nextToken, Items: items } = await getRestApis({
      MaxResults: '100',
      NextToken: nextToken
    }))

    const api = items?.find(item => (Protocol == null || item.Protocol === Protocol) && item.Name === Name)

    if (api) {
      return api
    }
  } while (nextToken != null)

  return null
}

export default getApi
