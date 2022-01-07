import ApiGatewayV2, { GetTagsResponse } from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log } from '../utils'

const getTags = async (
  params: {
    Region: string
    ApiId: string
  },
  log: Log = getLog('GET-TAGS')
): Promise<GetTagsResponse | undefined> => {
  const { Region, ApiId } = params

  const gateway = new ApiGatewayV2({ region: Region })

  const getTagsExecutor = retry(gateway, gateway.getTags, Options.Defaults.override({ log }))

  try {
    log.debug(`Find tags in "${ApiId}" api gateway`)

    const ResourceArn = `arn:aws:apigateway:${Region}::/apis/${ApiId}`

    const tags = await getTagsExecutor({ ResourceArn })

    return tags
  } catch (error) {
    log.error(`Failed to get tags "${ApiId}" api gateway`)
    throw error
  }
}

export default getTags
