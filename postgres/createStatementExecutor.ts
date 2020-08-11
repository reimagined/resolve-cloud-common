import executeStatement from './executeStatement'
import { Log } from '../utils'

interface TExecutor {
  (sql: string, log?: Log): Promise<Array<any>>
}

interface TMethod {
  (params: { Region: string; ResourceArn: string; SecretArn: string }): TExecutor
}

const createStatementExecutor: TMethod = ({ Region, ResourceArn, SecretArn }) => {
  const executor: TExecutor = (sql, log) =>
    executeStatement(
      {
        Region,
        ResourceArn,
        SecretArn,
        Sql: sql,
      },
      log
    )
  return executor
}

export default createStatementExecutor
