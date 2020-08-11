import S3, { PresignedPost } from 'aws-sdk/clients/s3'

import { getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      BucketName: string
      Key: string
      Expires?: number /* in seconds */
      MaxSize?: number
      ContentType?: string
      Metadata?: { [key: string]: string }
    },
    log?: Log
  ): Promise<PresignedPost>
}

const isTrailingSlash = /\/$/

function getConditions(params: {
  MaxSize?: number
  ContentType?: string
  Metadata?: { [key: string]: string }
}): Array<[string, any, any]> | undefined {
  const { MaxSize, ContentType, Metadata } = params

  const Conditions: Array<[string, any, any]> = []
  if (MaxSize != null) {
    Conditions.push(['content-length-range', 0, MaxSize])
  }
  if (ContentType != null) {
    if (isTrailingSlash.test(ContentType)) {
      Conditions.push(['starts-with', '$Content-Type', ContentType])
    } else {
      Conditions.push(['eq', '$Content-Type', ContentType])
    }
  }
  if (Metadata != null) {
    for (const [key, value] of Object.entries(Metadata)) {
      Conditions.push(['eq', `$x-amz-meta-${key}`, value])
    }
  }
  if (Conditions.length !== 0) {
    return Conditions
  }
  return undefined
}

function assignMetadata(presignedPost: PresignedPost, Metadata?: { [key: string]: string }): void {
  if (Metadata != null) {
    for (const [key, value] of Object.entries(Metadata)) {
      presignedPost.fields[`x-amz-meta-${key}`] = value
    }
  }
}

const createPresignedPost: TMethod = async (
  { Region, BucketName, Key, Expires, Metadata, MaxSize, ContentType },
  log = getLog(`CREATE-PRESIGNED-POST`)
) => {
  const s3 = new S3({
    region: Region,
    signatureVersion: 'v4',
    useAccelerateEndpoint: true,
  })

  try {
    log.debug(`Create signed url for POST-request to "${BucketName}" S3 bucket`)

    const presignedPost = s3.createPresignedPost({
      Bucket: BucketName,
      Fields: {
        Key,
      },
      Expires,
      Conditions: getConditions({
        ContentType,
        MaxSize,
        Metadata,
      }),
    })

    assignMetadata(presignedPost, Metadata)

    return presignedPost
  } catch (error) {
    log.error('Signed url creating is failed')
    throw error
  }
}

export default createPresignedPost
