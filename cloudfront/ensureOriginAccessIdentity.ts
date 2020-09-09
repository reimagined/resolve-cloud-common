import { getLog, Log } from '../utils'

import getCloudFrontOriginAccessIdentity from './getCloudFrontOriginAccessIdentity'
import createCloudFrontOriginAccessIdentity from './createCloudFrontOriginAccessIdentity'

const ensureOriginAccessIdentity = async (
  params: {
    Region: string
    Comment: string
  },
  log: Log = getLog('ENSURE-ORIGIN-ACCESS-IDENTITY')
): Promise<{
  Id: string
  S3CanonicalUserId: string
}> => {
  const { Region, Comment } = params

  log.debug(`searching for origin access identity "${Comment}"`)

  try {
    const identity = await getCloudFrontOriginAccessIdentity(
      {
        Region,
        Comment
      },
      log
    )
    return identity
  } catch (error) {
    if (error != null && error.message === 'Identity is not found') {
      const identity = await createCloudFrontOriginAccessIdentity({
        Region,
        Comment
      })

      return identity
    }

    throw error
  }
}

export default ensureOriginAccessIdentity
