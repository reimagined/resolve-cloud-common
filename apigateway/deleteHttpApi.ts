import ApiGatewayV2, { Api } from 'aws-sdk/clients/apigatewayv2'
import Resourcegroupstaggingapi from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log, ignoreAlreadyExistsException } from '../utils'

const deleteHttpApi = async (
  params: {
    Region: string
    Name: string
    IfExists?: boolean
  },
  log: Log = getLog('DELETE-HTTP-API')
): Promise<void> => {
  const { Region, Name, IfExists } = params

  const gateway = new ApiGatewayV2({ region: Region })
  const taggingApi = new Resourcegroupstaggingapi({ region: Region })

  const deleteHttpApiExecutor = retry(
    gateway,
    gateway.deleteApi,
    Options.Defaults.override({ log })
  )

  const untaggingResources = retry(
    taggingApi,
    taggingApi.untagResources,
    Options.Defaults.override({ log })
  )

  const getHttpApisExecutor = retry(gateway, gateway.getApis, Options.Defaults.override({ log }))

  let httpApiId: Api | undefined
  try {
    log.debug(`Delete the "${Name}" HTTP API`)

    let NextToken: string | undefined

    searchLoop: for (;;) {
      const { Items, NextToken: token } = await getHttpApisExecutor({ MaxResults: '50', NextToken })

      if (Items != null) {
        for (const Item of Items) {
          if (Item.Name === Name) {
            httpApiId = Item
            break searchLoop
          }
        }
      }

      if (Items == null || Items.length === 0 || NextToken == null || NextToken === '') {
        break searchLoop
      }

      NextToken = token
    }

    if (httpApiId == null || httpApiId.ApiId == null) {
      const error: Error & { code?: string } = new Error('Rest api not found')
      error.code = 'ResourceNotFoundException'
      throw error
    }

    await deleteHttpApiExecutor({ ApiId: httpApiId.ApiId })

    try {
      if (httpApiId.Tags != null) {
        await untaggingResources({
          ResourceARNList: [`arn:aws:apigateway:${Region}::/apis/${httpApiId.ApiId}`],
          TagKeys: Object.keys(httpApiId.Tags)
        })
      }
    } catch (error) {
      log.warn(error)
    }

    log.debug('The HTTP API has been deleted')
  } catch (error) {
    if (IfExists) {
      ignoreAlreadyExistsException(error)
    } else {
      log.error('Failed to delete the HTTP API')
      throw error
    }
  }
}

export default deleteHttpApi
