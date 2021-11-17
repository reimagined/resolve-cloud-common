import S3 from 'aws-sdk/clients/s3'

import { retry, getLog, Log, Options } from '../utils'

async function abortMultipartUpload(
  params: {
    Region: string
    BucketName: string
    FileKey: string
    UploadId: string
  },
  log: Log = getLog('ABORT-MULTIPART-UPLOAD')
): Promise<void> {
  const { Region, BucketName, FileKey, UploadId } = params

  log.debug(`Abort the multipart upload "${UploadId}"`)

  const s3 = new S3({
    region: Region
  })

  const complete = retry(s3, s3.abortMultipartUpload, Options.Defaults.override({ log }))

  try {
    await complete({
      Bucket: BucketName,
      Key: FileKey,
      UploadId
    })

    log.debug(`The multipart abort "${UploadId}" has been completed`)
  } catch (error) {
    log.debug(`Failed to complete the multipart abort "${UploadId}"`)
    throw error
  }
}

export default abortMultipartUpload
