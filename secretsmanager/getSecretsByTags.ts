import SecretsManager from 'aws-sdk/clients/secretsmanager'
import { retry, Options, getLog, Log } from '../utils'

const getSecretsByTags = async (
  params: {
    Region: string
    Tags: Record<string, string>
  },
  log: Log = getLog(`GET-SECRETS-BY-TAGS`)
): Promise<
  Array<{
    ResourceARN: string
    Name: string
    Tags: Record<string, string>
  }>
> => {
  const { Region, Tags } = params

  const secretsManager = new SecretsManager({ region: Region })

  const listSecrets = retry(
    secretsManager,
    secretsManager.listSecrets,
    Options.Defaults.override({ log })
  )

  const Filters = []

  for (const [key, value] of Object.entries(Tags)) {
    Filters.push(
      {
        Key: 'tag-key',
        Values: [key]
      },
      {
        Key: 'tag-value',
        Values: [value]
      }
    )
  }

  const resources: Array<{ ResourceARN: string; Name: string; Tags: Record<string, string> }> = []

  try {
    log.debug(`Find secret by tags`)

    let NextToken: string | undefined
    for (;;) {
      log.debug(`Get secret by NextToken = ${NextToken ?? '<none>'}`)

      const { SecretList = [], NextToken: FollowingNextToken } = await listSecrets({
        Filters,
        MaxResults: 100,
        NextToken
      })
      NextToken = FollowingNextToken

      for (const { ARN: ResourceARN, Tags: ResourceTags = [], Name } of SecretList) {
        if (ResourceARN != null && Name != null) {
          resources.push({
            ResourceARN,
            Name,
            Tags: ResourceTags.reduce((acc: Record<string, string>, { Key, Value }) => {
              if (Key != null && Value != null) {
                acc[Key] = Value
              }
              return acc
            }, {})
          })
        }
      }

      if (
        SecretList == null ||
        SecretList.length === 0 ||
        FollowingNextToken == null ||
        FollowingNextToken === ''
      ) {
        break
      }
    }

    log.debug(`Secrets have been found`)
    return resources
  } catch (error) {
    log.debug(`Failed to find secrets by tags`)
    throw error
  }
}

export default getSecretsByTags
