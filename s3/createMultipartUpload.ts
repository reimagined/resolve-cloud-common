import S3 from 'aws-sdk/clients/s3'

import { retry, getLog, Log, Options } from '../utils'

async function createMultipartUpload(
  params: { Region: string; BucketName: string; FileKey: string },
  log: Log = getLog('CREATE-MULTIPART-UPLOAD')
): Promise<string> {
  const { Region, BucketName, FileKey } = params

  log.debug(`Create a multipart upload`)

  const s3 = new S3({
    region: Region
  })

  const create = retry(s3, s3.createMultipartUpload, Options.Defaults.override({ log }))

  try {
    const { UploadId } = await create({
      Bucket: BucketName,
      Key: FileKey
    })

    if (UploadId == null) {
      throw new Error(`Incorrect upload id "${UploadId}"`)
    }

    log.debug(`The multipart upload "${UploadId}" has been created`)

    return UploadId
  } catch (error) {
    log.debug(`Failed to create a multipart`)
    throw error
  }
}

export default createMultipartUpload
