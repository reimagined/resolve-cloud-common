import S3 from 'aws-sdk/clients/s3'

import { retry, Options, getLog, Log } from '../../utils'

interface TMethod {
  (
    params: {
      Region: string,
      BucketName: string,
      PublicAccessBlockConfiguration: string
    },
    log: Log
  ): Promise<void>
}

const putS3PublicAccessBlock: TMethod = async ({ Region, BucketName, PublicAccessBlockConfiguration }, log = getLog('PUT-S3-PUBLIC-ACCESS-BLOCK')) => {
  const s3 = new S3({ region: Region })

  try {
    log.debug(`Put "${BucketName}" bucket public access block`)

    const putPublicAccessBlock = retry(s3, s3.putPublicAccessBlock, Options.Defaults.override({
      maxAttempts: 5,
      delay: 1000
    }))

    await putPublicAccessBlock({
      Bucket: BucketName,
      PublicAccessBlockConfiguration
    })

    log.debug(`Public access put successfully`)
  } catch (error) {
    log.error(`Public access put failed`)
    throw error
  }
}

export default putS3PublicAccessBlock
