import TaggingAPI from 'aws-sdk/clients/resourcegroupstaggingapi'
import ACM from 'aws-sdk/clients/acm'

import { retry, Options, getLog, Log } from '../utils'

async function getResourcesByTags(
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log
): Promise<Array<{ ResourceARN: string; Tags: Record<string, string> }>> {
  const { Region, Tags } = params

  const TagFilters = Object.entries(Tags).map(([Key, Value]) => ({ Key, Values: [Value] }))

  const api = new TaggingAPI({ region: Region })

  const getResources = retry(api, api.getResources, Options.Defaults.override({ log }))

  const resources: Array<{ ResourceARN: string; Tags: Record<string, string> }> = []

  try {
    log.debug(`Find resources by tags`)

    let PaginationToken: string | undefined
    for (;;) {
      log.debug(`Get resources by PaginationToken = ${PaginationToken ?? '<none>'}`)
      const { ResourceTagMappingList = [], PaginationToken: NextPaginationToken } =
        await getResources({
          ResourceTypeFilters: ['acm:certificate'],
          TagFilters,
          PaginationToken
        })
      PaginationToken = NextPaginationToken

      for (const { ResourceARN, Tags: ResourceTags = [] } of ResourceTagMappingList) {
        if (ResourceARN != null) {
          resources.push({
            ResourceARN,
            Tags: ResourceTags.reduce((acc: Record<string, string>, { Key, Value }) => {
              acc[Key] = Value
              return acc
            }, {})
          })
        }
      }

      if (
        ResourceTagMappingList == null ||
        ResourceTagMappingList.length === 0 ||
        NextPaginationToken == null ||
        NextPaginationToken === ''
      ) {
        break
      }
    }

    log.debug(`Resources have been found`)
  } catch (error) {
    log.debug(`Failed to find resources by tags`)
    throw error
  }

  return resources
}

async function getResourcesByList(
  params: {
    Region: string
  },
  log: Log
): Promise<
  Array<{
    CertificateArn: string
    DomainName: string
  }>
> {
  const { Region } = params

  const acm = new ACM({ region: Region })

  const listCertificates = retry(acm, acm.listCertificates, Options.Defaults.override({ log }))

  const items: Array<{
    CertificateArn: string
    DomainName: string
  }> = []

  try {
    log.debug(`List certificates`)

    let NextToken: string | undefined
    for (;;) {
      log.debug(`Get resources by Marker = ${NextToken ?? '<none>'}`)
      const { CertificateSummaryList, NextToken: FollowingNextToken } = await listCertificates({
        MaxItems: 50,
        NextToken,
        Includes: {
          keyTypes: ['RSA_1024', 'RSA_2048']
        }
      })

      if (CertificateSummaryList != null) {
        for (const Certificate of CertificateSummaryList) {
          const { CertificateArn, DomainName } = Certificate ?? {}
          if (CertificateArn != null && DomainName != null) {
            items.push({
              CertificateArn,
              DomainName
            })
          }
        }
      }

      if (
        CertificateSummaryList == null ||
        CertificateSummaryList.length === 0 ||
        FollowingNextToken == null ||
        FollowingNextToken === ''
      ) {
        break
      }

      NextToken = FollowingNextToken
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
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog('GET-CLOUD-FRONT-DISTRIBUTIONS-BY-TAGS')
): Promise<Array<{ ResourceARN: string; Tags: Record<string, string>; DomainName: string }>> {
  const [resourcesByTags, listResources] = await Promise.all([
    getResourcesByTags(params, log),
    getResourcesByList(params, log)
  ])

  type ResourceType = typeof listResources[0]

  const resourceMap = new Map(
    listResources.map((resource: ResourceType) => [resource.CertificateArn, resource])
  )

  const resources: Array<{
    ResourceARN: string
    Tags: Record<string, string>
    DomainName: string
  }> = []
  for (const { ResourceARN, Tags } of resourcesByTags) {
    const resource = resourceMap.get(ResourceARN)
    if (resource != null) {
      resources.push({ ResourceARN, Tags, DomainName: resource.DomainName })
    }
  }

  log.verbose(resources)

  return resources
}

export default getCloudFrontDistributionsByTags
