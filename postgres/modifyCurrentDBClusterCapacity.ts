import RDS from 'aws-sdk/clients/rds'
import { retry, Options, getLog, Log } from '../utils'

const modifyCurrentDBClusterCapacity = async (
  params: {
    Region: string
    DBClusterIdentifier: string
    Capacity?: number
    TimeoutAction?: 'ForceApplyCapacityChange' | 'RollbackCapacityChange'
  },
  log: Log = getLog('MODIFY-CURRENT-DB-CLUSTER-CAPACITY')
): Promise<void> => {
  const { Region, DBClusterIdentifier, Capacity, TimeoutAction } = params
  const inputAction = TimeoutAction ?? 'ForceApplyCapacityChange'

  const rds = new RDS({ region: Region })
  const describeDBClusters = retry(
    rds,
    rds.describeDBClusters,
    Options.Defaults.override({ log, maxAttempts: 2 })
  )
  const modifyCurrentDBClusterCapacityExecutor = retry(
    rds,
    rds.modifyCurrentDBClusterCapacity,
    Options.Defaults.override({ log, maxAttempts: 2 })
  )

  let { DBClusters } = await describeDBClusters({ DBClusterIdentifier })
  if (DBClusters == null || DBClusters.length < 1) {
    throw new Error('Failed to get database cluster')
  }
  let [cluster] = DBClusters
  if (cluster == null || cluster.DBClusterIdentifier == null) {
    throw new Error('Failed to  get database cluster identifier')
  }

  for (let iteration = 0; ; iteration++) {
    await modifyCurrentDBClusterCapacityExecutor({
      DBClusterIdentifier: cluster.DBClusterIdentifier,
      Capacity,
      TimeoutAction: inputAction
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

    if (cluster.Capacity === Capacity) {
      break
    }
  }
}

export default modifyCurrentDBClusterCapacity
