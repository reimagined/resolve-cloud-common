import RDSDataService from 'aws-sdk/clients/rdsdataservice'

import { getLog, retry, Options, Log } from '../utils'

const coercer = ({
  intValue,
  stringValue,
  bigIntValue,
  longValue,
  booleanValue,
  isNull,
  ...rest
}: any): any => {
  if (intValue != null) {
    return Number(intValue)
  }
  if (bigIntValue != null) {
    return Number(bigIntValue)
  }
  if (longValue != null) {
    return Number(longValue)
  }
  if (stringValue != null) {
    return String(stringValue)
  }
  if (booleanValue != null) {
    return Boolean(booleanValue)
  }
  if (isNull != null) {
    return null
  }
  throw new Error(`Unknown type ${JSON.stringify(rest)}`)
}

interface TMethod {
  (
    params: { Region: string; ResourceArn: string; SecretArn: string; Sql: string },
    log?: Log
  ): Promise<Array<any>>
}

const executeStatement: TMethod = async (
  { Region, ResourceArn, SecretArn, Sql },
  log = getLog('EXECUTE_STATEMENT')
) => {
  const rdsDataService = new RDSDataService({
    region: Region
  })
  log.verbose(Sql)

  const execute = retry(
    rdsDataService,
    rdsDataService.executeStatement,
    Options.Defaults.override({ log, maxAttempts: 1 })
  )
  const result = await execute({
    resourceArn: ResourceArn,
    secretArn: SecretArn,
    database: 'postgres',
    continueAfterTimeout: false,
    includeResultMetadata: true,
    sql: Sql
  })

  const { columnMetadata, records } = result

  if (!Array.isArray(records) || columnMetadata == null) {
    return []
  }

  const rows: Array<any> = []
  for (const record of records) {
    const row: { [key: string]: any } = {}
    for (let i = 0; i < columnMetadata.length; i++) {
      const meta = columnMetadata[i]
      if (meta.name != null) {
        row[meta.name] = coercer(record[i])
      }
    }
    rows.push(row)
  }

  log.verbose(JSON.stringify(rows, null, 2))

  return rows
}

export default executeStatement
