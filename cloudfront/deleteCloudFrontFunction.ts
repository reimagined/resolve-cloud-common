import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'
import describeCloudFrontFunction from './describeCloudFrontFunction'
import { DEFAULT_REGION } from './constants'

const deleteCloudFrontFunction = async (
  params: {
    Region?: string
    Name: string
  },
  log: Log = getLog('DELETE-CLOUD-FRONT-FUNCTION')
): Promise<void> => {
  const { Region = DEFAULT_REGION, Name } = params
  const cloudfront = new CloudFront({ region: Region, apiVersion: '2020-05-31' })

  const deleteCloudFrontFunctionExecutor = retry(
    cloudfront,
    cloudfront.deleteFunction,
    Options.Defaults.override({ log })
  )

  try {
    log.debug(`Deleting cloudfront function "${Name}"`)

    const { ETag } = await describeCloudFrontFunction({
      Region,
      Name,
      IncludeDevStage: true
    })

    if (ETag == null) {
      throw new Error(`Cloudfront function "${Name}" does not exist`)
    }

    const result = await deleteCloudFrontFunctionExecutor({
      IfMatch: ETag,
      Name
    })

    if (result == null) {
      throw new Error(`Failed to delete "${Name}" cloudfront function`)
    }

    log.debug(`Cloudfront function "${Name}" has been delete`)
  } catch (error) {
    log.debug(`Failed to delete "${Name}" cloudfront function`)
    throw error
  }
}

export default deleteCloudFrontFunction
