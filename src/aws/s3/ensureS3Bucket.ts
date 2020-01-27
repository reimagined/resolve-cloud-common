import S3 from 'aws-sdk/clients/s3'

import { retry, Options, getLog, Log } from '../../utils'

const checkIfBucketExists = async (
  { Region, BucketName }: { Region: string, BucketName: string },
  log: Log
): Promise<boolean> => {
  const s3 = new S3({ region: Region })

  try {
    log.debug(`Get "${BucketName}" bucket head`)

    const headBucket = retry(s3, s3.headBucket, Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000
    }))

    await headBucket({
      Bucket: BucketName
    })

    log.debug(`Head got successfully`)
    return true
  } catch (error) {
    if (error.code === 'NotFound') {
      log.debug(`Bucket is not found`)
      return false
    }
    throw error
  }
}

interface TMethod {
  (
    params: {
      Region: string
      BucketName: string,
      ACL: string,
      TagSet: Array<{ Key: string, Value: string }>,
      Policy: string
    },
    log?: Log
  ): Promise<void>
}

const ensureS3Bucket: TMethod = async (
  { Region, BucketName, ACL, TagSet, Policy },
  log = getLog('ENSURE-S3-BUCKET')
) => {
  const s3 = new S3({ region: Region })

  try {
    log.debug(`Ensuring "${BucketName}" S3 bucket`)
    log.debug(`Check bucket existing by head request`)

    const doesBucketExist = await checkIfBucketExists({
      Region: Region,
      BucketName: BucketName
    }, log)

    if (!doesBucketExist) {
      log.debug(`Bucket not found. Create "${BucketName}" bucket`)

      const params = {
        Bucket: BucketName,
        ACL,
        CreateBucketConfiguration: {
          LocationConstraint: Region
        }
      }

      const createBucket = retry(s3, s3.createBucket, Options.Defaults.override({
        maxAttempts: 5,
        delay: 1000
      }))

      await createBucket(params)

      log.debug(`"${BucketName}" created. Tagging the bucket`)

      const putBucketTagging = retry(s3, s3.putBucketTagging)

      await putBucketTagging({
        Bucket: BucketName,
        Tagging: {
          TagSet
        }
      })

      log.debug(`The bucket tagged successfully`)
    }

    log.debug(`Updating "${BucketName}" bucket policy`)

    const putBucketPolicy = retry(s3, s3.putBucketPolicy)

    await putBucketPolicy({
      Bucket: BucketName,
      Policy
    })

    log.debug(`"${BucketName}" bucket policy updated`)
    log.debug(`"${BucketName}" bucket ensured successfully`)
  } catch (error) {
    log.error(`"${BucketName}" bucket creation failed`)
    throw error
  }
}

export default ensureS3Bucket
