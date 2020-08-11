import S3, { CompletedPart } from 'aws-sdk/clients/s3'

import { retry, getLog, Log, Options } from '../utils'

async function uploadPart(
  params: {
    Region: string
    BucketName: string
    FileKey: string
    UploadId: string
    Body: Buffer
    Parts: Array<CompletedPart>
    PartNumber: number
  },
  log: Log = getLog('UPLOAD-PART')
): Promise<void> {
  const { Region, BucketName, FileKey, UploadId, Body, Parts, PartNumber } = params

  log.debug(`Upload the part UploadId = "${UploadId}" / PartNumber = "${PartNumber}"`)

  const s3 = new S3({
    region: Region,
  })

  const upload = retry(s3, s3.uploadPart, Options.Defaults.override({ log }))

  try {
    const { ETag } = await upload({
      Bucket: BucketName,
      Key: FileKey,
      UploadId,
      PartNumber,
      Body,
    })

    log.verbose(`UploadId = "${UploadId}"`)
    log.verbose(`ETag = "${ETag}"`)

    Parts.push({
      ETag,
      PartNumber,
    })

    log.verbose(`Parts = ${JSON.stringify(Parts)}`)
  } catch (error) {
    log.debug(`Failed to upload the part UploadId = "${UploadId}" / PartNumber = "${PartNumber}"`)
    throw error
  }
}

export default uploadPart
