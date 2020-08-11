import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { getLog, retry, Options, Log } from '../utils'
import { highloadExecute } from './highloadExecute'

function coercer(field: {
  intValue?: number
  stringValue?: string
  bigIntValue?: number
  longValue?: number
  doubleValue?: number
  booleanValue?: boolean
  isNull?: boolean
  [key: string]: any
}): number | string | boolean | null {
  if (field.intValue != null) {
    return Number(field.intValue)
  }
  if (field.bigIntValue != null) {
    return Number(field.bigIntValue)
  }
  if (field.longValue != null) {
    return Number(field.longValue)
  }
  if (field.doubleValue != null) {
    return Number(field.doubleValue)
  }
  if (field.stringValue != null) {
    return String(field.stringValue)
  }
  if (field.booleanValue != null) {
    return Boolean(field.booleanValue)
  }
  if (field.isNull != null) {
    return null
  }
  throw new Error(`Unknown type ${JSON.stringify(field)}`)
}

async function executeStatement<T extends object>(
  params: { Region: string; ResourceArn: string; SecretArn: string; Sql: string },
  log: Log = getLog('EXECUTE_STATEMENT')
): Promise<Array<T>> {
  const { Region, ResourceArn, SecretArn, Sql } = params

  const rdsDataService = new RDSDataService({
    region: Region,
  })
  log.verbose(Sql)

  const execute = retry(
    rdsDataService,
    highloadExecute(rdsDataService.executeStatement),
    Options.Defaults.override({ log, maxAttempts: 1 })
  )
  const result = await execute({
    resourceArn: ResourceArn,
    secretArn: SecretArn,
    database: 'postgres',
    continueAfterTimeout: false,
    includeResultMetadata: true,
    sql: Sql,
  })

  const { columnMetadata, records } = result

  if (!Array.isArray(records) || columnMetadata == null) {
    return []
  }

  const rows: Array<T> = []
  for (const record of records) {
    const row = {} as T
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
