import { getLog, Log } from '../utils'
import createHttpApi from './createHttpApi'
import getApi from './getApi'

interface TMethod {
  (
    params: {
      Region: string
      Stage: string
      Name: string
      ApiStage: string
      LambdaArn: string
      AccountId: string
    },
    log?: Log
  ): Promise<{ ApiId: string; ApiEndpoint: string }>
}

const ensureHttpApi: TMethod = async (
  { Region, Stage, Name, ApiStage, LambdaArn, AccountId },
  log = getLog(`ENSURE-HTTP-API`)
) => {
  try {
    log.debug(`Getting "${Name}" API`)

    const restApi = await getApi({ Region, Name })

    if (restApi != null) {
      log.debug(`API found, returning`)

      return {
        ApiId: restApi.ApiId || '',
        ApiEndpoint: restApi.ApiEndpoint || ''
      }
    }

    log.debug(`API not found, creating`)

    const { ApiId = '', ApiEndpoint = '' } = await createHttpApi({
      Region,
      Stage,
      Name,
      ApiStage,
      LambdaArn,
      AccountId
    })

    log.debug(`API has been created`)

    return {
      ApiId,
      ApiEndpoint
    }
  } catch (e) {
    log.error(`Failed to ensure HTTP API`)
    throw e
  }
}

export default ensureHttpApi
