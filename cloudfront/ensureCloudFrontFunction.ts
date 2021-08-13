import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'
import describeCloudFrontFunction from './describeCloudFrontFunction'
import updateCloudFrontFunction from './updateCloudFrontFunction'
import publishCloudFrontFunction from './publishCloudFrontFunction'
import { DEFAULT_REGION } from './constants'

const ensureCloudFrontFunction = async (
  params: {
    Region?: string
    FunctionCode: Buffer
    FunctionConfig: {
      Comment: string
      Runtime: string
    }
    Name: string
  },
  log: Log = getLog('CREATE-CLOUD-FRONT-FUNCTION')
): Promise<CloudFront.CreateFunctionResult | CloudFront.UpdateFunctionResult | undefined> => {
  const { Region = DEFAULT_REGION, FunctionCode, FunctionConfig, Name } = params
  const cloudFront = new CloudFront({ region: Region, apiVersion: '2020-05-31' })

  try {
    try {
      log.debug(`Cloudfront function "${Name}" already exist. Update cloudfront function ${Name}`)
      const result = await updateCloudFrontFunction({
        Region,
        FunctionCode,
        FunctionConfig,
        Name
      })
      if (result == null) {
        throw new Error(`Failed to update cloudfront function "${Name}"`)
      }
      log.debug(`Cloudfront function "${Name}" has been update`)
    } catch (error) {
      log.debug(`Failed to update cloudfront function "${Name}"`)
      throw error
    }
  } catch (error) {
    if (error == null || error.code !== 'NoSuchFunctionExists') {
      throw error
    }

    const ensureCloudFrontFunctionExecutor = retry(
      cloudFront,
      cloudFront.createFunction,
      Options.Defaults.override({ log })
    )

    try {
      log.debug(`Create cloudfront function "${Name}"`)
      const result = await ensureCloudFrontFunctionExecutor({
        FunctionCode: Buffer.from(FunctionCode),
        FunctionConfig,
        Name
      })

      if (result == null) {
        throw new Error(`Failed to create cloudfront function "${Name}"`)
      }
      log.debug(`Cloudfront function "${Name}" has been create`)
      // eslint-disable-next-line no-shadow
    } catch (error) {
      log.debug(`Failed to create cloudfront function "${Name}"`)
      throw error
    }
  }

  await publishCloudFrontFunction({
    Region,
    Name
  })
  // eslint-disable-next-line no-return-await
  return await describeCloudFrontFunction({
    Region,
    Name
  })
}

export default ensureCloudFrontFunction
