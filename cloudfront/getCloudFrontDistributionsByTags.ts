import Cloudfront, { DistributionSummary } from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'
import { DEFAULT_REGION } from './constants'

async function listResources(
  params: {
    Region: string
  },
  log: Log
): Promise<Array<DistributionSummary>> {
  const { Region } = params

  const cloudFront = new Cloudfront({ region: Region })

  const listDistributions = retry(
    cloudFront,
    cloudFront.listDistributions,
    Options.Defaults.override({ log })
  )

  const items: Array<DistributionSummary> = []

  try {
    log.debug(`List distributions`)

    let Marker: string | undefined
    for (;;) {
      log.debug(`Get resources by Marker = ${Marker ?? '<none>'}`)
      const { DistributionList: { Items = [], IsTruncated, NextMarker } = {} } =
        await listDistributions({
          Marker
        })

      items.push(...Items)

      if (
        !IsTruncated ||
        Items == null ||
        Items.length === 0 ||
        NextMarker == null ||
        NextMarker === ''
      ) {
        break
      }

      Marker = NextMarker
    }

    log.debug(`List resources have been found`)
  } catch (error) {
    log.debug(`Failed to find list resources`)
    throw error
  }

  return items
}

async function getCloudFrontDistributionsByTags(
  params: {
    Region?: 'us-east-1'
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-CLOUD-FRONT-DISTRIBUTIONS-BY-TAGS')
): Promise<
  Array<{
    Tags: Record<string, string>
    Distribution: DistributionSummary
  }>
> {
  const { Tags, Region = DEFAULT_REGION } = params

  const distributions = await listResources({ Region }, log)

  const cloudFront = new Cloudfront({ region: Region })

  const listTagsForResource = retry(
    cloudFront,
    cloudFront.listTagsForResource,
    Options.Defaults.override({ log })
  )

  const resourcesByTags: Record<string, Record<string, string>> = {}

  const batchSize = 20

  for (
    let batchIndex = 0;
    batchIndex < Math.floor(distributions.length / batchSize);
    batchIndex++
  ) {
    await Promise.all(
      distributions
        .slice(batchIndex * batchSize, (batchIndex + 1) * batchSize)
        .map(async (distribution) => {
          const { Tags: { Items = [] } = {} } = await listTagsForResource({
            Resource: distribution.ARN
          })
          const tags: Record<string, string> = {}
          for (const { Key, Value } of Items) {
            if (Key != null && Value != null) {
              tags[Key] = Value
            }
          }
          for (const [Key, Value] of Object.entries(Tags)) {
            if (tags[Key] !== Value) {
              return
            }
          }
          resourcesByTags[distribution.ARN] = tags
        })
    )
  }

  const resources = distributions
    .filter(({ ARN }) => resourcesByTags[ARN] != null)
    .map((Distribution) => ({
      Distribution,
      Tags: resourcesByTags[Distribution.ARN]
    }))

  log.verbose(resources)

  return resources
}

export default getCloudFrontDistributionsByTags
