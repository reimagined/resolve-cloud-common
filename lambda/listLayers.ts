import Lambda, { Runtime, Architecture, LayersListItem } from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

const listLayers = async (
  params: {
    Region: string
    CompatibleRuntime?: Runtime
    CompatibleArchitecture?: Architecture
  },
  log: Log = getLog('LIST-LAYERS')
): Promise<Array<LayersListItem>> => {
  const { Region, CompatibleArchitecture, CompatibleRuntime } = params

  const lambda = new Lambda({ region: Region })

  const listLayersExecutor = retry(lambda, lambda.listLayers, Options.Defaults.override({ log }))

  try {
    log.debug('List layers')

    const layers: Array<LayersListItem> = []
    let Marker: string | undefined

    for (;;) {
      log.debug(`Get resources by Marker = ${Marker ?? '<none>'}`)
      const { Layers = [], NextMarker } = await listLayersExecutor({
        Marker,
        CompatibleArchitecture,
        CompatibleRuntime
      })

      layers.push(...Layers)

      if (Layers == null || Layers.length === 0 || NextMarker == null || NextMarker === '') {
        break
      }

      Marker = NextMarker
    }

    log.debug(`List layers have been found`)

    return layers
  } catch (error) {
    log.debug(`Failed to find list of layers`)
    throw error
  }
}

export default listLayers
