import S3, { CompletedPart } from 'aws-sdk/clients/s3'

import { retry, getLog, Log, Options } from '../utils'

async function completeMultipartUpload(
  params: {
    Region: string
    BucketName: string
    FileKey: string
    UploadId: string
    Parts: Array<CompletedPart>
  },
  log: Log = getLog('COMPLETE-MULTIPART-UPLOAD')
): Promise<void> {
  const { Region, BucketName, FileKey, UploadId, Parts } = params

  log.debug(`Complete the multipart upload "${UploadId}"`)

  const s3 = new S3({
    region: Region,
  })

  const complete = retry(s3, s3.completeMultipartUpload, Options.Defaults.override({ log }))

  try {
    await complete({
      Bucket: BucketName,
      Key: FileKey,
      MultipartUpload: { Parts },
      UploadId,
    })

    log.debug(`The multipart upload "${UploadId}" has been completed`)
  } catch (error) {
    log.debug(`Failed to complete the multipart upload "${UploadId}"`)
    throw error
  }
}

export default completeMultipartUpload
