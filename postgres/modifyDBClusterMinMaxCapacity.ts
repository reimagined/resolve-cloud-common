import RDS from 'aws-sdk/clients/rds'
import { retry, Options, getLog, Log } from '../utils'

const modifyDBClusterMinMaxCapacity = async (
  params: {
    Region: string
    DBClusterIdentifier: string
    MinCapacity?: number
    MaxCapacity?: number
  },
  log: Log = getLog('MODIFY-DB-CLUSTER-MIN-MAX-CAPACITY')
): Promise<void> => {
  const { Region, DBClusterIdentifier, MinCapacity, MaxCapacity } = params

  const rds = new RDS({ region: Region })
  const describeDBClusters = retry(
    rds,
    rds.describeDBClusters,
    Options.Defaults.override({ log, maxAttempts: 2 })
  )
  const modifyDBClusterExecutor = retry(
    rds,
    rds.modifyDBCluster,
    Options.Defaults.override({ log })
  )

  let { DBClusters } = await describeDBClusters({ DBClusterIdentifier })
  if (DBClusters == null || DBClusters.length < 1) {
    throw new Error('Failed to get database cluster')
  }
  let [cluster] = DBClusters
  if (cluster == null || cluster.DBClusterIdentifier == null) {
    throw new Error('Failed to get database cluster identifier')
  }

  for (let iteration = 0; ; iteration++) {
    await modifyDBClusterExecutor({
      DBClusterIdentifier: cluster.DBClusterIdentifier,
      AllowMajorVersionUpgrade: false,
      ApplyImmediately: true,
      ScalingConfiguration: {
        MinCapacity,
        MaxCapacity
      }
    })

    await new Promise((resolve) => setTimeout(resolve, 2 ** iteration))

    void ({ DBClusters } = await describeDBClusters({ DBClusterIdentifier }))
    if (DBClusters == null || DBClusters.length < 1) {
      throw new Error('Failed to get database cluster')
    }
    void ([cluster] = DBClusters)
    if (cluster == null || cluster.DBClusterIdentifier == null) {
      throw new Error('Failed to get database cluster identifier')
    }

    if (
      cluster.ScalingConfigurationInfo?.MinCapacity === MinCapacity &&
      cluster.ScalingConfigurationInfo?.MaxCapacity === MaxCapacity
    ) {
      break
    }
  }
}

export default modifyDBClusterMinMaxCapacity
