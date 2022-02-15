import Lambda, { Architecture, Runtime } from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const publishLayerVersion = async (
  params: {
    Region: string
    LayerName: string
    S3Bucket: string
    S3Key: string
    CompatibleArchitectures?: Array<Architecture>
    CompatibleRuntimes?: Array<Runtime>
    Description?: string
    LicenseInfo?: string
  },
  log: Log = getLog('PUBLISH-LAYER-VERSION')
) => {
  const {
    Region,
    LayerName,
    S3Bucket,
    S3Key,
    CompatibleArchitectures,
    CompatibleRuntimes,
    Description,
    LicenseInfo
  } = params

  const lambda = new Lambda({ region: Region })

  const publishLayer = retry(lambda, lambda.publishLayerVersion, Options.Defaults.override({ log }))

  try {
    log.debug('List layers')

    const result = await publishLayer({
      LayerName,
      Content: {
        S3Bucket,
        S3Key
      },
      CompatibleArchitectures,
      CompatibleRuntimes,
      Description,
      LicenseInfo
    })

    log.debug(`List layers have been found`)

    return result
  } catch (error) {
    log.debug(`Failed to find list of layers`)
    throw error
  }
}

export default publishLayerVersion
