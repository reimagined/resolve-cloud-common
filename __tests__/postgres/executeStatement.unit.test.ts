import RDSDataService from 'aws-sdk/clients/rdsdataservice'

import { mockedSdkFunction } from '../mockedSdkFunction'
import executeStatement from '../../postgres/executeStatement'

jest.mock('../../utils')

const mockExecuteStatement = mockedSdkFunction(RDSDataService.prototype.executeStatement)

describe('executeStatement', () => {
  test('should works correctly', async () => {
    mockExecuteStatement.mockResolvedValue({
      columnMetadata: [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }],
      records: [
        [{ booleanValue: true }, { longValue: 42 }, { stringValue: 'str-1' }, { isNull: true }],
        [{ booleanValue: false }, { doubleValue: 1.5 }, { stringValue: 'str-2' }, { isNull: true }]
      ]
    })

    const result: Array<{
      a: boolean
      b: number
      c: string
      d: null
    }> = await executeStatement({
      Sql: 'SELECT * FROM "database"."table"',
      Region: 'region',
      ResourceArn: 'resourceArn',
      SecretArn: 'secretArn'
    })

    expect(result[0].a).toEqual(true)
    expect(result[0].b).toEqual(42)
    expect(result[0].c).toEqual('str-1')
    expect(result[0].d).toEqual(null)

    expect(result[1].a).toEqual(false)
    expect(result[1].b).toEqual(1.5)
    expect(result[1].c).toEqual('str-2')
    expect(result[1].d).toEqual(null)
  })
})
