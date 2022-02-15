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
    log.debug(`Publish layer with "${LayerName}" name`)

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

    log.debug(`Publish layer with "${LayerName}" name complete`)

    return result
  } catch (error) {
    log.debug(`Failed to publish layer with "${LayerName}" name`)
    throw error
  }
}

export default publishLayerVersion
