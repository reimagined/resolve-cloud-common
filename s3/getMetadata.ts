import S3 from 'aws-sdk/clients/s3'

import { retry, getLog, Log, Options } from '../utils'

async function getMetadata(
  params: { Region: string; BucketName: string; FileKey: string },
  log: Log = getLog('GET-METADATA')
): Promise<Record<string, string>> {
  const { Region, BucketName, FileKey } = params

  log.debug(`Get a file size for "${BucketName}"/$"{FileKey}"`)

  const s3 = new S3({
    region: Region
  })

  const headObject = retry(s3, s3.headObject, Options.Defaults.override({ log }))

  try {
    const { Metadata = {} } = await headObject({
      Bucket: BucketName,
      Key: FileKey
    })

    log.debug(`The metadata for "${BucketName}"/"${FileKey}" has been got`)
    log.verbose(`The metadata for "${BucketName}"/"${FileKey}" = ${JSON.stringify(Metadata)}`)

    return Metadata
  } catch (error) {
    log.debug(`Failed get a metadata for "${BucketName}"/"${FileKey}"`)
    throw error
  }
}

export default getMetadata
