import RDS from 'aws-sdk/clients/rds'
import Resourcegroupstaggingapi from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteDBCluster = async (
  params: {
    Region: string
    DBClusterIdentifier: string
    SkipFinalSnapshot?: boolean
    FinalDBSnapshotIdentifier?: string
    IfExists: boolean
  },
  log: Log = getLog('DELETE-DATABASE-CLUSTER')
): Promise<void> => {
  const {
    Region,
    DBClusterIdentifier,
    SkipFinalSnapshot,
    FinalDBSnapshotIdentifier,
    IfExists
  } = params

  const rds = new RDS({ region: Region })
  const taggingAPI = new Resourcegroupstaggingapi({ region: Region })

  try {
    const deleteDBClusterExecutor = retry(
      rds,
      rds.deleteDBCluster,
      Options.Defaults.override({ log })
    )
    const describeDBClusters = retry(
      rds,
      rds.describeDBClusters,
      Options.Defaults.override({ log })
    )
    const listTagsForResource = retry(
      rds,
      rds.listTagsForResource,
      Options.Defaults.override({ log })
    )

    const untagResources = retry(
      taggingAPI,
      taggingAPI.untagResources,
      Options.Defaults.override({ log })
    )

    const clusters = await describeDBClusters({ DBClusterIdentifier, MaxRecords: 1 })
    if (clusters == null || clusters.DBClusters == null || clusters.DBClusters.length !== 1) {
      throw new Error(`DB cluster ${DBClusterIdentifier} has not found`)
    }
    const {
      DBClusters: [{ DBClusterArn }]
    } = clusters

    try {
      if (DBClusterArn != null) {
        const { TagList } = await listTagsForResource({ ResourceName: DBClusterArn })

        if (TagList != null && TagList.length > 0) {
          await untagResources({
            ResourceARNList: [DBClusterArn],
            TagKeys: TagList.map(({ Key }) => Key)
          })
        }
      }
    } catch (error) {
      log.warn(error)
    }

    await deleteDBClusterExecutor({
      DBClusterIdentifier,
      SkipFinalSnapshot,
      FinalDBSnapshotIdentifier
    })

    log.debug(`RDS database cluster has been deleted`)
  } catch (error) {
    if (IfExists) {
      log.debug(`Skip deleting RDS database cluster`)
      ignoreNotFoundException(error)
    } else {
      log.debug(`Failed to delete RDS database cluster`)

      throw error
    }
  }
}

export default deleteDBCluster
