import executeStatement from './executeStatement'
import { Log } from '../utils'

const createStatementExecutor = (params: {
  Region: string
  ResourceArn: string
  SecretArn: string
}): ((sql: string, log?: Log) => Promise<Array<any>>) => {
  const { Region, ResourceArn, SecretArn } = params

  const executor = (sql: string, log?: Log): Promise<Array<any>> =>
    executeStatement(
      {
        Region,
        ResourceArn,
        SecretArn,
        Sql: sql
      },
      log
    )
  return executor
}

export default createStatementExecutor
