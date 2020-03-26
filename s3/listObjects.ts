import S3, { ObjectList, CommonPrefixList } from 'aws-sdk/clients/s3'

import { Log } from '../utils'

interface TResult {
  Contents: ObjectList
  CommonPrefixes: CommonPrefixList
}

interface TMethod {
  (
    params: {
      Region: string
      BucketName: string
      Prefix?: string
      Delimiter?: string
    },
    log?: Log
  ): Promise<TResult>
}

const listObjects: TMethod = ({ Region, BucketName, Prefix = '', Delimiter = '' }) => {
  const s3 = new S3({ region: Region })

  const listAll = async (
    acc: TResult = {
      Contents: [],
      CommonPrefixes: []
    },
    token?: string
  ) => {
    const { IsTruncated, NextContinuationToken, Contents, CommonPrefixes } = await s3
      .listObjectsV2({
        Bucket: BucketName,
        Prefix,
        Delimiter,
        ContinuationToken: token
      })
      .promise()

    if (Contents != null) {
      acc.Contents.push(...Contents)
    }

    if (CommonPrefixes != null) {
      acc.CommonPrefixes.push(...CommonPrefixes)
    }

    if (IsTruncated) {
      await listAll(acc, NextContinuationToken)
    }

    return acc
  }

  return listAll()
}

export default listObjects
