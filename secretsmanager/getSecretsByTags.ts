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

  const resources: Array<{ ResourceARN: string; Name: string; Tags: Record<string, string> }> = []

  try {
    log.debug(`Find secrets by tags`)

    let NextToken: string | undefined
    for (;;) {
      log.debug(`Get secrets by NextToken = ${NextToken ?? '<none>'}`)

      const { SecretList = [], NextToken: FollowingNextToken } = await listSecrets({
        MaxResults: 100,
        NextToken
      })
      NextToken = FollowingNextToken

      for (const { ARN: ResourceARN, Tags: ResourceTags = [], Name } of SecretList) {
        if (ResourceARN != null && Name != null) {
          const matchedTags = ResourceTags.reduce((acc: number, { Key, Value }) => {
            return Key != null && Value != null && Tags[Key] === Value ? acc + 1 : acc
          }, 0)

          if (matchedTags === Object.keys(Tags).length) {
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
