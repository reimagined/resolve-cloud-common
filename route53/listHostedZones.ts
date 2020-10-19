import Route53 from 'aws-sdk/clients/route53'

import { retry, Options, getLog, Log } from '../utils'

const listHostedZones = async (
  params: Record<string, unknown>,
  log: Log = getLog('LIST-HOSTED-ZONES')
): Promise<
  Array<{
    Name: string
    HostedZoneId: string
  }>
> => {
  const route53 = new Route53()

  const listHostedZonesExecutor = retry(
    route53,
    route53.listHostedZones,
    Options.Defaults.override({ log })
  )

  const zones = []

  let Marker: string | undefined
  for (;;) {
    try {
      const { NextMarker, IsTruncated, HostedZones } = await listHostedZonesExecutor({
        MaxItems: '100',
        Marker
      })

      for (const { Id, Name } of HostedZones) {
        zones.push({ HostedZoneId: Id.replace(/^\/hostedzone\//, ''), Name })
      }

      if (
        !IsTruncated ||
        NextMarker == null ||
        NextMarker === '' ||
        HostedZones == null ||
        HostedZones.length === 0
      ) {
        break
      }

      Marker = NextMarker
    } catch (error) {
      log.error(error)
      throw error
    }
  }

  return zones
}

export default listHostedZones
