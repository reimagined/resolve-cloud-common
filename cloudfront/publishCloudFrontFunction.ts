import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'
import describeCloudFrontFunction from './describeCloudFrontFunction'
import { DEFAULT_REGION } from './constants'

const publishCloudFrontFunction = async (
  params: {
    Region?: string
    Name: string
  },
  log: Log = getLog('PUBLISH-CLOUD-FRONT-FUNCTION')
): Promise<CloudFront.PublishFunctionResult> => {
  const { Name, Region = DEFAULT_REGION } = params

  const cloudFront = new CloudFront({ region: Region, apiVersion: '2020-05-31' })

  const publishCloudfrontFunctionExecutor = retry(
    cloudFront,
    cloudFront.publishFunction,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Publish "${Name}" cloudfront function`)
    const { ETag } = await describeCloudFrontFunction({
      Region,
      Name,
      IncludeDevStage: true
    })

    if (ETag == null) {
      throw new Error(`Cloudfront function "${Name}" does not exist`)
    }

    const result = await publishCloudfrontFunctionExecutor({
      IfMatch: ETag,
      Name
    })

    if (result == null) {
      throw new Error(`Failed to create "${Name}" cloudfront function`)
    }

    log.debug(`Cloudfront function "${Name}" has been publish`)
    return result
  } catch (error) {
    log.debug(`Failed to publish "${Name}" cloudfront function`)
    throw error
  }
}

export default publishCloudFrontFunction
