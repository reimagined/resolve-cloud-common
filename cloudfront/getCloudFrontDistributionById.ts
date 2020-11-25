import CloudFront, { Distribution as DistributionType } from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'
import { DEFAULT_REGION } from './constants'

const getCloudFrontDistributionById = async (
  params: {
    Region?: 'us-east-1'
    Id: string
  },
  log: Log = getLog('GET-CLOUD-FRONT-DISTRIBUTION-BY-ID')
): Promise<{
  Distribution: DistributionType
  ETag?: string
  Tags: Record<string, string>
}> => {
  const { Region = DEFAULT_REGION, Id } = params

  const cloudFront = new CloudFront({ region: Region })

  const getDistribution = retry(
    cloudFront,
    cloudFront.getDistribution,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000,
      log
    })
  )

  const listTagsForResource = retry(
    cloudFront,
    cloudFront.listTagsForResource,
    Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000,
      log
    })
  )

  try {
    log.debug('get distribution')

    const { Distribution, ETag } = await getDistribution({ Id })

    if (Distribution == null) {
      const error: Error & { code?: string } = new Error(`The distribution "${Id}" is not found`)
      error.code = 'NoSuchDistribution'
      throw error
    }

    const {
      Tags: { Items: tags = [] }
    } = await listTagsForResource({ Resource: Distribution.ARN })

    const Tags: Record<string, string> = tags.reduce((acc, tag) => {
      const { Key, Value } = tag
      if (Value != null) {
        acc[Key] = Value
      }
      return acc
    }, {} as Record<string, string>)

    log.debug('distribution found')

    return {
      Distribution,
      ETag,
      Tags
    }
  } catch (error) {
    log.error('distribution getting is failed')
    throw error
  }
}

export default getCloudFrontDistributionById
