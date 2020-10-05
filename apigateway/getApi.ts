import ApiGatewayV2, { Api, ProtocolType } from 'aws-sdk/clients/apigatewayv2'

import { Log, Options, retry, getLog } from '../utils'

const getApi = async (
  params: {
    Region: string
    Name: string
    ProtocolType?: ProtocolType
  },
  log: Log = getLog('GET-API')
): Promise<Api | null> => {
  const { Region, Name, ProtocolType: Protocol } = params

  let nextToken
  let items

  const gateway = new ApiGatewayV2({ region: Region })

  const getRestApis = retry(gateway, gateway.getApis, Options.Defaults.override({ log }))

  do {
    void ({ NextToken: nextToken, Items: items } = await getRestApis({
      MaxResults: '100',
      NextToken: nextToken
    }))

    const api = items?.find(
      (item) => (Protocol == null || item.ProtocolType === Protocol) && item.Name === Name
    )

    if (api) {
      return api
    }
  } while (nextToken != null)

  return null
}

export default getApi
