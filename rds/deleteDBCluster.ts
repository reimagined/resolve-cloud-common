import RDS from 'aws-sdk/clients/rds'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      DBClusterIdentifier: string
      SkipFinalSnapshot?: boolean
      FinalDBSnapshotIdentifier?: string
    },
    log?: Log
  ): Promise<void>
}

const deleteDBCluster: TMethod = async (
  { Region, DBClusterIdentifier, SkipFinalSnapshot, FinalDBSnapshotIdentifier },
  log = getLog('DELETE-DATABASE-CLUSTER')
) => {
  const rds = new RDS({ region: Region })

  try {
    const deleteDBClusterExecutor = retry(
      rds,
      rds.createDBCluster,
      Options.Defaults.override({ log })
    )

    await deleteDBClusterExecutor({
      DBClusterIdentifier,
      SkipFinalSnapshot,
      FinalDBSnapshotIdentifier
    })

    log.debug(`RDS database cluster has been deleted`)
  } catch (error) {
    log.debug(`Failed to delete RDS database cluster`)

    throw error
  }
}

export default deleteDBCluster
