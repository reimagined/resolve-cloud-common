import RDS, {
  DBCluster,
  ScalingConfiguration as ScalingConfigurationType
} from 'aws-sdk/clients/rds'

import { retry, Options, getLog, Log } from '../utils'

const createDBCluster = async (
  params: {
    Region: string
    DBClusterIdentifier: string
    MasterUsername: string
    MasterUserPassword: string
    MinCapacity?: number
    MaxCapacity?: number
    SecondsUntilAutoPause?: number | null
    TimeoutAction?: 'ForceApplyCapacityChange' | 'RollbackCapacityChange'
    Tags?: Record<string, string>
    IfNotExists?: boolean
  },
  log: Log = getLog('ENSURE-DATABASE-CLUSTER')
): Promise<DBCluster> => {
  const {
    Region,
    DBClusterIdentifier,
    MasterUsername,
    MasterUserPassword,
    MinCapacity,
    MaxCapacity,
    SecondsUntilAutoPause,
    TimeoutAction = 'RollbackCapacityChange',
    Tags = {},
    IfNotExists
  } = params

  Tags.Owner = 'reimagined'

  if (MasterUsername === 'admin') {
    throw new Error(
      'MasterUsername admin cannot be used as it is a reserved word used by the engine'
    )
  }
  if (MasterUserPassword.length < 8) {
    throw new Error(
      'The parameter MasterUserPassword is not a valid password because it is shorter than 8 characters.'
    )
  }

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
    if (DBClusters != null && DBClusters.length > 0 && !IfNotExists) {
      throw new Error(`Cluster with the same cluster id "${DBClusterIdentifier}" already exists`)
    }
  } catch (error) {
    if (error != null && !/DBCluster .*? not found/i.test(error.message)) {
      throw error
    }
  }

  const ScalingConfiguration: ScalingConfigurationType = {
    MinCapacity,
    MaxCapacity,
    TimeoutAction
  }

  if (SecondsUntilAutoPause != null) {
    ScalingConfiguration.AutoPause = true
    ScalingConfiguration.SecondsUntilAutoPause = SecondsUntilAutoPause
  } else {
    ScalingConfiguration.AutoPause = false
  }

  try {
    const createResult = await createDBClusterExecutor({
      DBClusterIdentifier,
      MasterUsername,
      MasterUserPassword,
      Engine: 'aurora-postgresql',
      EngineVersion: '10.14',
      EngineMode: 'serverless',
      ScalingConfiguration,
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

export default createDBCluster
