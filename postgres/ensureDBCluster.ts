import RDS, { DBCluster } from 'aws-sdk/clients/rds'

import { retry, Options, getLog, Log } from '../utils'

const ensureDBCluster = async (
  params: {
    Region: string
    DBClusterIdentifier: string
    MinCapacity?: number
    MaxCapacity?: number
    Tags?: Record<string, string>
  },
  log: Log = getLog('ENSURE-DATABASE-CLUSTER')
): Promise<DBCluster> => {
  const { Region, DBClusterIdentifier, MinCapacity, MaxCapacity, Tags = {} } = params

  Tags.Owner = 'reimagined'

  const rds = new RDS({ region: Region })

  const createDBClusterExecutor = retry(
    rds,
    rds.createDBCluster,
    Options.Defaults.override({ log })
  )
  const describeDBClusters = retry(
    rds,
    rds.describeDBClusters,
    Options.Defaults.override({ log, maxAttempts: 2 })
  )

  try {
    const { DBClusters } = await describeDBClusters({ DBClusterIdentifier })
    if (DBClusters == null || DBClusters.length < 1) {
      throw new Error('Failed to get database cluster')
    }
    return DBClusters[0]
  } catch (error) {
    if (error != null && !/DBCluster .*? not found/i.test(error.message)) {
      throw error
    }
  }

  try {
    const createResult = await createDBClusterExecutor({
      DBClusterIdentifier,
      Engine: 'aurora-postgresql',
      EngineVersion: '10.7',
      EngineMode: 'serverless',
      ScalingConfiguration: {
        AutoPause: true,
        SecondsUntilAutoPause: 300,
        MinCapacity,
        MaxCapacity
      },
      StorageEncrypted: true,
      EnableHttpEndpoint: true,
      Tags: Object.entries(Tags).map(([Key, Value]) => ({ Key, Value }))
    })

    if (createResult == null || createResult.DBCluster == null) {
      throw new Error('Failed to create RDS database cluster')
    }

    log.debug(`RDS database cluster has been created`)

    return createResult.DBCluster
  } catch (error) {
    log.debug(`Failed to create RDS database cluster`)

    throw error
  }
}

export default ensureDBCluster
