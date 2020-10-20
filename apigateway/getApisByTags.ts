import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'
import { retry, Options, getLog, Log } from '../utils'

const getApisByTags = async (
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog(`GET-APIS-BY-TAGS`)
): Promise<
  Array<{
    ApiId: string
    Tags: Record<string, string>
  }>
> => {
  const { Region, Tags } = params

  const apiGatewayV2 = new ApiGatewayV2({ region: Region })

  const getApis = retry(apiGatewayV2, apiGatewayV2.getApis, Options.Defaults.override({ log }))

  const resources: Array<{ ApiId: string; Tags: Record<string, string> }> = []

  try {
    log.debug(`Find apis by tags`)

    let NextToken: string | undefined
    for (;;) {
      log.debug(`Get apis by NextToken = ${NextToken ?? '<none>'}`)

      const { Items = [], NextToken: FollowingNextToken } = await getApis({
        MaxResults: '100',
        NextToken
      })
      NextToken = FollowingNextToken

      for (const { ApiId, Tags: ResourceTags = {} } of Items) {
        if (ApiId != null) {
          const matchedTags = Object.entries(ResourceTags).reduce((acc: number, [Key, Value]) => {
            return Key != null && Value != null && Tags[Key] === Value ? acc + 1 : acc
          }, 0)

          if (matchedTags === Object.keys(Tags).length) {
            resources.push({
              ApiId,
              Tags: ResourceTags
            })
          }
        }
      }

      if (
        Items == null ||
        Items.length === 0 ||
        FollowingNextToken == null ||
        FollowingNextToken === ''
      ) {
        break
      }
    }

    log.debug(`Apis have been found`)
    return resources
  } catch (error) {
    log.debug(`Failed to find apis by tags`)
    throw error
  }
}

export default getApisByTags
