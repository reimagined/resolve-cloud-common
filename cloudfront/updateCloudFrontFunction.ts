import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'
import describeCloudFrontFunction from './describeCloudFrontFunction'
import { DEFAULT_REGION } from './constants'

const updateCloudFrontFunction = async (
  params: {
    Region?: string
    FunctionCode: Buffer
    FunctionConfig: {
      Comment: string
      Runtime: string
    }
    Name: string
  },
  log: Log = getLog('UPDATE-CLOUD-FRONT-FUNCTION')
): Promise<CloudFront.UpdateFunctionResult> => {
  const { Region = DEFAULT_REGION, Name, FunctionCode, FunctionConfig } = params
  const cloudfront = new CloudFront({ region: Region, apiVersion: '2020-05-31' })

  const updateCloudFrontFunctionExecutor = retry(
    cloudfront,
    cloudfront.updateFunction,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Update cloudfront function "${Name}"`)
    const { ETag } = await describeCloudFrontFunction({
      Region,
      Name,
      IncludeDevStage: true
    })

    if (ETag == null) {
      throw new Error(`Cloudfront function "${Name}" does not exist`)
    }

    const result = updateCloudFrontFunctionExecutor({
      FunctionCode: Buffer.from(FunctionCode),
      FunctionConfig,
      IfMatch: ETag,
      Name
    })

    if (result == null) {
      throw new Error(`Failed to update cloudfront function "${Name}"`)
    }
    log.debug(`Update cloudfront function "${Name}" succesfuly complete`)
    return result
  } catch (error) {
    log.debug(`Failed to update cloudfront function "${Name}"`)
    throw error
  }
}

export default updateCloudFrontFunction
