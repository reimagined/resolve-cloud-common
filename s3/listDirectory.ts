import { Log } from '../utils'
import listObjects from './listObjects'

interface TMethod {
  (
    params: {
      Region: string
      BucketName: string
      Prefix?: string
      Delimiter?: string
    },
    log?: Log
  ): Promise<Array<string>>
}

const listDirectory: TMethod = async ({ Region, BucketName, Prefix, Delimiter }) => {
  const { CommonPrefixes } = await listObjects({
    Region,
    BucketName,
    Prefix,
    Delimiter,
  })

  return CommonPrefixes.reduce(
    (acc: Array<string>, { Prefix: prefix }) => (prefix != null ? acc.concat(prefix) : acc),
    []
  )
}

export default listDirectory
