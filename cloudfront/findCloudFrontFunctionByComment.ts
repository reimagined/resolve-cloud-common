import { getLog, Log } from '../utils'
import listCloudFrontFunction from './listCloudFrontFunctions'
import { DEFAULT_REGION } from './constants'

const findCloudFrontFunctionByComment = async (
  params: {
    Region?: string
    Comment: string
  },
  log: Log = getLog('FIND-CLOUD-FRONT-FUNCTION')
): Promise<{ Name: string; Arn: string }[] | null> => {
  const { Region = DEFAULT_REGION, Comment } = params

  try {
    log.debug('Find cloudfront function')
    const FunctionList = await listCloudFrontFunction({ Region })
    const result = []

    for (const item of FunctionList) {
      if (item.FunctionMetadata?.Stage === 'LIVE' && item?.FunctionConfig?.Comment === Comment) {
        result.push({ Name: item.Name, Arn: item.FunctionMetadata.FunctionARN })
      }
    }

    if (result.length > 0) {
      log.debug(`Cloudfront function has been found`)
      return result
    } else {
      log.debug(`Cloudfront function not found`)
      return null
    }
  } catch (error) {
    log.debug('Failed to find cloudfront function')
    throw error
  }
}

export default findCloudFrontFunctionByComment
