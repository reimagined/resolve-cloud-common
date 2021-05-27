import RDS, { DBClusterList } from 'aws-sdk/clients/rds'

import { getLog, Log, Options, retry } from '../utils'

const describeDBClusters = async (
  params: { Region: string; DBClusterArns: Array<string> },
  log: Log = getLog('DESCRIBE-DB-CLUSTERS')
): Promise<DBClusterList> => {
  const { Region, DBClusterArns } = params
  const rds = new RDS({
    region: Region
  })

  const describeDBClustersExecutor = retry(
    rds,
    rds.describeDBClusters,
    Options.Defaults.override({ log })
  )

  const clusters: DBClusterList = []

  try {
    log.debug(`List DB clusters`)

    let Marker: string | undefined
    for (;;) {
      log.debug(`Get resources by Marker = ${Marker ?? '<none>'}`)
      const { DBClusters, Marker: NextMarker } = await describeDBClustersExecutor({
        Marker,
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: DBClusterArns
          }
        ]
      })

      if (DBClusters == null || DBClusters.length === 0) {
        break
      }

      DBClusters.map((cluster) => clusters.push(cluster))

      if (NextMarker == null || NextMarker === '') {
        break
      }

      Marker = NextMarker
    }

    log.debug(`List DB clusters have been found`)
    return clusters
  } catch (error) {
    log.debug(`Failed to find list DB clusters`)
    throw error
  }
}

export default describeDBClusters
