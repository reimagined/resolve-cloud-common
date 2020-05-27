import S3 from 'aws-sdk/clients/s3'

import { retry, getLog, Log, Options } from '../utils'

async function getFileSize(
  params: { Region: string; BucketName: string; FileKey: string },
  log: Log = getLog('GET-FILE-SIZE')
): Promise<number> {
  const { Region, BucketName, FileKey } = params

  log.debug(`Get a file size for "${BucketName}"/$"{FileKey}"`)

  const s3 = new S3({
    region: Region
  })

  const headObject = retry(s3, s3.headObject, Options.Defaults.override({ log }))

  try {
    const { ContentLength } = await headObject({
      Bucket: BucketName,
      Key: FileKey
    })

    if (ContentLength == null) {
      throw new Error('Incorrect content length')
    }

    log.debug(`The file size for "${BucketName}"/"${FileKey}" = ${ContentLength}`)

    return ContentLength
  } catch (error) {
    log.debug(`Failed get a file size for "${BucketName}"/"${FileKey}"`)
    throw error
  }
}

export default getFileSize
