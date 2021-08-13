import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'
import { DEFAULT_REGION } from './constants'

const describeCloudFrontFunction = async (
  params: {
    Region?: string
    Name: string
    IncludeDevStage?: boolean
  },
  log: Log = getLog('DESCRIBE-CLOUD-FRONT-FUNCTION')
): Promise<CloudFront.DescribeFunctionResult> => {
  const { Region = DEFAULT_REGION, IncludeDevStage = false, Name: inputName } = params
  const Name = (inputName.match(/^arn:aws:cloudfront::\w+?:function\/(.*?)$/) ?? [])[0] ?? inputName

  const cloudfront = new CloudFront({ region: Region, apiVersion: '2020-05-31' })

  const describeCloudFrontFunctionExecutor = retry(
    cloudfront,
    cloudfront.describeFunction,
    Options.Defaults.override({ log })
  )

  if (IncludeDevStage) {
    try {
      log.debug(`Getting describe cloudfront function "${Name}"`)

      const result = await describeCloudFrontFunctionExecutor({ Name, Stage: 'DEVELOPMENT' })
      if (result == null) {
        throw new Error(`Failed to get describe cloudfront function "${Name}"`)
      }

      log.debug(`Describe cloudfront function "${Name}" succesfuly complete`)
      return result
    } catch (error) {
      if (error == null || error.code !== 'NoSuchFunctionExists') {
        log.debug(`Failed to get describe cloudfront function "${Name}"`)
        throw error
      }
    }
  }

  try {
    log.debug(`Getting describe cloudfront function "${Name}"`)

    const result = await describeCloudFrontFunctionExecutor({ Name, Stage: 'LIVE' })
    if (result == null) {
      throw new Error(`Failed to get describe cloudfront function "${Name}"`)
    }

    log.debug(`Describe cloudfront function "${Name}" succesfuly complete`)
    return result
  } catch (error) {
    log.debug(`Failed to get describe cloudfront function "${Name}"`)
    throw error
  }
}

export default describeCloudFrontFunction
