import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const getFunctionVersion = async (
  params: {
    Region: string
    FunctionName: string
  },
  log: Log = getLog('GET-FUNCTION-VERSION')
): Promise<number> => {
  const { Region, FunctionName } = params

  try {
    const lambda = new Lambda({ region: Region })

    log.debug(`Get current function version`)

    const listVersionsByFunction = retry(
      lambda,
      lambda.listVersionsByFunction,
      Options.Defaults.override({ log })
    )

    let Marker: string | undefined
    let LatestVersion = 0
    searchLoop: for (;;) {
      const { NextMarker, Versions } = await listVersionsByFunction({
        FunctionName,
        MaxItems: 60,
        Marker
      })

      if (Versions != null) {
        for (const { Version } of Versions) {
          if (Version != null && +Version > LatestVersion) {
            LatestVersion = +Version
          }
        }
      }

      if (NextMarker == null || NextMarker === '' || Versions == null || Versions.length === 0) {
        break searchLoop
      }

      Marker = NextMarker
    }

    if (LatestVersion === 0) {
      throw new Error('Failed to get function version')
    }

    log.debug(`Function version have been got`)

    return LatestVersion
  } catch (error) {
    log.debug(`Failed to get function version`)
    throw error
  }
}

export default getFunctionVersion
