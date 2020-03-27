import ACM from 'aws-sdk/clients/acm'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      CertificateArn: string
      Tags: Array<{ Key: string; Value: string }>
    },
    log?: Log
  ): Promise<void>
}

const addTagsToCertificate: TMethod = async (
  { Region, CertificateArn, Tags },
  log = getLog('ADD-TAGS-TO-CERTIFICATE')
) => {
  const acm = new ACM({ region: Region })

  try {
    log.debug(`Add tags to certificate`)

    const addTagsToCertificateExecutor = retry(
      acm,
      acm.addTagsToCertificate,
      Options.Defaults.override({ log })
    )

    await addTagsToCertificateExecutor({ CertificateArn, Tags })

    log.debug(`Tags has been added to the certificate`)
  } catch (error) {
    log.debug(`Failed to add tags to the certificate`)

    throw error
  }
}

export default addTagsToCertificate
