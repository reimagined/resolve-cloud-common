import CloudFront, {
  OriginRequestPolicyConfig,
  OriginRequestPolicyCookiesConfig,
  OriginRequestPolicyQueryStringsConfig,
  OriginRequestPolicyHeadersConfig,
  OriginRequestPolicyCookieBehavior,
  OriginRequestPolicyQueryStringBehavior,
  OriginRequestPolicyHeaderBehavior,
  Headers,
  QueryStringNames,
  CookieNames
} from 'aws-sdk/clients/cloudfront'

import { retry, Options, getLog, Log } from '../utils'

const createOriginRequestPolicy = async (
  params: {
    Region: string
    OriginRequestPolicyName: string
    ConfigCookieBehavior?: OriginRequestPolicyCookieBehavior
    ConfigQueryStringBehavior?: OriginRequestPolicyQueryStringBehavior
    ConfigHeaderBehavior?: OriginRequestPolicyHeaderBehavior
    CustomHeaders?: Headers
    CustomQueryString?: QueryStringNames
    CustomCookie?: CookieNames
  },
  log: Log = getLog('CREATE-ORIGIN-REQUEST-POLICY')
): Promise<string | undefined> => {
  const {
    Region,
    OriginRequestPolicyName,
    ConfigCookieBehavior = 'all',
    ConfigQueryStringBehavior = 'all',
    ConfigHeaderBehavior = 'allViewer',
    CustomHeaders = null,
    CustomQueryString = null,
    CustomCookie = null
  } = params
  const cloudfront = new CloudFront({ region: Region })

  const createOriginRequestPolicyExecutor = retry(
    cloudfront,
    cloudfront.createOriginRequestPolicy,
    Options.Defaults.override({ log })
  )

  const configCookies: OriginRequestPolicyCookiesConfig =
    CustomCookie === null
      ? { CookieBehavior: ConfigCookieBehavior }
      : {
          CookieBehavior: ConfigCookieBehavior,
          Cookies: CustomCookie
        }

  const configQueryString: OriginRequestPolicyQueryStringsConfig =
    CustomQueryString === null
      ? { QueryStringBehavior: ConfigQueryStringBehavior }
      : {
          QueryStringBehavior: ConfigQueryStringBehavior,
          QueryStrings: CustomQueryString
        }

  const configHeaders: OriginRequestPolicyHeadersConfig =
    CustomHeaders === null
      ? { HeaderBehavior: ConfigHeaderBehavior }
      : {
          HeaderBehavior: ConfigHeaderBehavior,
          Headers: CustomHeaders
        }

  const config: OriginRequestPolicyConfig = {
    Name: OriginRequestPolicyName,
    CookiesConfig: configCookies,
    QueryStringsConfig: configQueryString,
    HeadersConfig: configHeaders
  }

  try {
    log.debug(`Create the cache policy "${OriginRequestPolicyName}"`)

    const { OriginRequestPolicy } = await createOriginRequestPolicyExecutor({
      OriginRequestPolicyConfig: config
    })

    log.debug(`Cache policy "${OriginRequestPolicyName}" has been created`)
    return OriginRequestPolicy?.Id
  } catch (error) {
    log.debug('Failed to create cache policy')
    throw error
  }
}

export default createOriginRequestPolicy
