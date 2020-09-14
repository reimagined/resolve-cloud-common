import RDS, { DBCluster } from 'aws-sdk/clients/rds'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      DBClusterIdentifier: string
      MinCapacity?: number
      MaxCapacity?: number
    },
    log?: Log
  ): Promise<DBCluster>
}

const ensureDBCluster: TMethod = async (
  { Region, DBClusterIdentifier, MinCapacity = 2, MaxCapacity = 2 },
  log = getLog('ENSURE-DATABASE-CLUSTER')
) => {
  const rds = new RDS({ region: Region })

  try {
    const { DBClusters } = await rds.describeDBClusters({ DBClusterIdentifier }).promise()
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
    const createDBClusterExecutor = retry(
      rds,
      rds.createDBCluster,
      Options.Defaults.override({ log })
    )

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
      EnableHttpEndpoint: true
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
