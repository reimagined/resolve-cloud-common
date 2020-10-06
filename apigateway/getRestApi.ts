import ApiGateway, { RestApi } from 'aws-sdk/clients/apigateway'

import { Log, Options, retry, getLog } from '../utils'

const getRestApi = async (
  params: {
    Region: string
    Name: string
  },
  log: Log = getLog('GET_REST_API')
): Promise<RestApi | null> => {
  const { Region, Name } = params

  let nextPosition
  let items

  const gateway = new ApiGateway({ region: Region })

  const getRestApis = retry(gateway, gateway.getRestApis, Options.Defaults.override({ log }))

  do {
    void ({ position: nextPosition, items } = await getRestApis({
      limit: 100,
      position: nextPosition
    }))

    const restApi = items?.find((item) => item.name === Name)

    if (restApi) {
      return restApi
    }
  } while (nextPosition != null)

  return null
}

export default getRestApi
