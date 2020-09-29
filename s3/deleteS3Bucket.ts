import S3 from 'aws-sdk/clients/s3'
import Resourcegroupstaggingapi from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log, ignoreNotFoundException, maybeThrowErrors } from '../utils'

const deleteS3Bucket = async (
  params: {
    Region: string
    BucketName: string
    IfExists?: boolean
    Force?: boolean
  },
  log: Log = getLog('DELETE-S3-BUCKET')
): Promise<void> => {
  const { Region, BucketName, IfExists = false, Force = false } = params

  const s3 = new S3({ region: Region })
  const taggingAPI = new Resourcegroupstaggingapi({ region: Region })

  try {
    const deleteBucket = retry(
      s3,
      s3.deleteBucket,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000,
        expectedErrors: ['NoSuchBucket']
      })
    )

    const listObjects = retry(
      s3,
      s3.listObjects,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000,
        expectedErrors: ['NoSuchBucket']
      })
    )
    const deleteObject = retry(
      s3,
      s3.deleteObject,
      Options.Defaults.override({
        expectedErrors: ['NoSuchKey']
      })
    )

    const getBucketTagging = retry(
      s3,
      s3.getBucketTagging,
      Options.Defaults.override({
        maxAttempts: 1
      })
    )

    const untagResources = retry(
      taggingAPI,
      taggingAPI.untagResources,
      Options.Defaults.override({ log, maxAttempts: 1 })
    )

    log.debug(`Delete the bucket "${BucketName}"`)

    if (Force) {
      const { Contents = [] } = await listObjects({ Bucket: BucketName })
      const promises: Array<Promise<void>> = []
      const errors: Array<Error> = []

      for (const { Key: FileKey } of Contents) {
        promises.push(
          (async (): Promise<void> => {
            try {
              if (FileKey != null) {
                await deleteObject({
                  Bucket: BucketName,
                  Key: FileKey
                })
              }
            } catch (error) {
              errors.push(error)
            }
          })()
        )
      }

      await Promise.all(promises)

      maybeThrowErrors(errors)
    }

    const { TagSet } = await getBucketTagging({
      Bucket: BucketName
    })

    await deleteBucket({
      Bucket: BucketName
    })

    try {
      const TagKeys = TagSet.map(({ Key }) => Key)

      const ResourceARNList = [`arn:aws:s3:::${BucketName}`]

      if(TagKeys.length > 0) {
        await untagResources({
          ResourceARNList,
          TagKeys
        })
        log.debug(`Bucket tags has been deleted`)
      }
    } catch (error) {
      log.warn(error)
    }

    log.debug(`The bucket "${BucketName}" has been deleted`)
  } catch (error) {
    if (IfExists) {
      log.error(`Skip delete the bucket "${BucketName}"`)
      ignoreNotFoundException(error)
    } else {
      log.error(`Failed to delete the bucket "${BucketName}"`)
      throw error
    }
  }
}

export default deleteS3Bucket
