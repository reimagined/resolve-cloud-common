import CloudFront from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'
import { DEFAULT_REGION } from './constants'

const PAGINATION_SIZE = 100

const listCloudFrontFunction = async (
  params: {
    Region?: string
  },
  log: Log = getLog('LIST-CLOUD-FRONT-FUNCTION')
): Promise<CloudFront.FunctionSummaryList> => {
  const { Region = DEFAULT_REGION } = params
  const cloudFront = new CloudFront({ region: Region })

  const listCloudFrontFunctionExecution = retry(
    cloudFront,
    cloudFront.listFunctions,
    Options.Defaults.override({ log })
  )
  // eslint-disable-next-line no-undef-init
  let NextMarker: CloudFront.ListFunctionsRequest['Marker'] = undefined
  const result: CloudFront.FunctionSummaryList = []

  for (;;) {
    try {
      log.debug('Getting list of cloudfront function')
      const currentResult: CloudFront.ListFunctionsResult = await listCloudFrontFunctionExecution({
        Marker: NextMarker,
        MaxItems: `${PAGINATION_SIZE}`,
        Stage: 'LIVE'
      })
      if (currentResult == null) {
        throw new Error('Failed to get list of cloudfront function')
      }
      const items = currentResult.FunctionList?.Items ?? []
      log.debug('CloudFront functions list successfully received')
      result.push(...items)

      NextMarker = currentResult.FunctionList?.NextMarker
      if (items.length < PAGINATION_SIZE) {
        break
      }
    } catch (error) {
      log.debug('Failed to get list of cloudfront function')
      throw error
    }
  }

  return result
}

export default listCloudFrontFunction
