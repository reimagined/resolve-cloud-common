import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'
import Resourcegroupstaggingapi from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log } from '../utils'

const deleteStage = async (
  params: {
    Region: string
    ApiId: string
    StageName: string
  },
  log: Log = getLog('DELETE-STAGE')
): Promise<void> => {
  const { Region, ApiId, StageName } = params

  const gateway = new ApiGatewayV2({ region: Region })
  const taggingApi = new Resourcegroupstaggingapi({ region: Region })

  const deleteStageExecutor = retry(
    gateway,
    gateway.deleteStage,
    Options.Defaults.override({ log })
  )
  const untagResourcesExecutor = retry(
    taggingApi,
    taggingApi.untagResources,
    Options.Defaults.override({ log })
  )
  const getStageExecutor = retry(gateway, gateway.getStage, Options.Defaults.override({ log }))

  try {
    log.debug(`Delete the stage "${StageName}"`)

    const { Tags } = await getStageExecutor({ ApiId, StageName })

    await deleteStageExecutor({
      ApiId,
      StageName
    })

    try {
      if (Tags != null) {
        await untagResourcesExecutor({
          ResourceARNList: [`arn:aws:apigateway:${Region}::/apis/${ApiId}/stages/${StageName}`],
          TagKeys: Object.keys(Tags)
        })
      }
    } catch (error) {
      log.warn(error)
    }
    log.debug(`The stage "${StageName}" has been deleted`)
  } catch (error) {
    log.error(`Failed to delete "${StageName}"`)
    throw error
  }
}

export default deleteStage
