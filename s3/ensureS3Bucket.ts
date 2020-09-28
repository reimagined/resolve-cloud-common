import S3 from 'aws-sdk/clients/s3'

import { retry, Options, getLog, Log } from '../utils'

const DEFAULT_BUCKET_REGION = 'us-east-1'

type AmazonACL = 'private' | 'public-read' | 'public-read-write' | 'authenticated-read'

const checkIfBucketExists = async (
  { Region, BucketName }: { Region: string; BucketName: string },
  log: Log
): Promise<boolean> => {
  const s3 = new S3({ region: Region })

  try {
    log.debug(`Get the bucket "${BucketName}" head`)

    const headBucket = retry(
      s3,
      s3.headBucket,
      Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000
      })
    )

    await headBucket({
      Bucket: BucketName
    })

    log.debug(`The bucket "${BucketName}" has been got`)
    return true
  } catch (error) {
    if (error.code === 'NotFound') {
      log.debug(`The bucket "${BucketName}" was not found`)
      return false
    }
    throw error
  }
}

async function ensureS3Bucket(
  params: {
    Region
    BucketName
    ACL?: AmazonACL
    Tags?: Record<string, string>
    Policy?: object
  },
  log: Log = getLog('ENSURE-S3-BUCKET')
): Promise<void> {
  const { Region, BucketName, ACL, Tags = {}, Policy } = params

  const TagSet: Array<{ Key: string; Value: string }> = [
    ...Array.from(Object.entries(Tags)).map(([Key, Value]) => ({
      Key,
      Value
    })),
    {
      Key: 'Owner',
      Value: 'reimagined'
    }
  ]

  const s3 = new S3({ region: Region })

  try {
    log.debug(`Ensure the bucket "${BucketName}"`)

    const doesBucketExist = await checkIfBucketExists(
      {
        Region,
        BucketName
      },
      log
    )

    if (!doesBucketExist) {
      log.debug(`Bucket was not found. Create the bucket "${BucketName}"`)

      const createBucketParams: {
        Bucket: string
        ACL?: AmazonACL
        CreateBucketConfiguration?: {
          LocationConstraint: string
        }
      } = {
        Bucket: BucketName,
        ACL
      }

      if (Region !== DEFAULT_BUCKET_REGION) {
        createBucketParams.CreateBucketConfiguration = {
          LocationConstraint: Region
        }
      }

      const createBucket = retry(
        s3,
        s3.createBucket,
        Options.Defaults.override({
          maxAttempts: 5,
          delay: 1000
        })
      )

      await createBucket(createBucketParams)

      log.debug(`The bucket "${BucketName}" has been created`)

      log.debug(`Setup the bucket "${BucketName}" tags`)

      const putBucketTagging = retry(s3, s3.putBucketTagging)

      await putBucketTagging({
        Bucket: BucketName,
        Tagging: {
          TagSet
        }
      })

      log.debug(`The bucket "${BucketName}" tags has been setup`)
    }

    log.debug(`Update the bucket "${BucketName}" policy`)

    if (Policy != null) {
      const putBucketPolicy = retry(s3, s3.putBucketPolicy)

      await putBucketPolicy({
        Bucket: BucketName,
        Policy: JSON.stringify(Policy)
      })

      log.debug(`The "${BucketName}" bucket policy has been updated`)
    } else {
      log.debug(`No "${BucketName}" bucket policy specified`)
    }

    log.debug(`The bucket "${BucketName}" has been ensured`)
  } catch (error) {
    log.error(`Failed to ensure the bucket "${BucketName}"`)
    throw error
  }
}

export default ensureS3Bucket
