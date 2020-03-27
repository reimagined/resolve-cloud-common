import ACM from 'aws-sdk/clients/acm'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      CertificateArn: string
    },
    log?: Log
  ): Promise<void>
}

const deleteCertificate: TMethod = async (
  { Region, CertificateArn },
  log = getLog('DELETE-CERTIFICATE')
) => {
  const acm = new ACM({ region: Region })

  try {
    log.debug(`Delete certificate`)

    const deleteCertificateExecutor = retry(
      acm,
      acm.deleteCertificate,
      Options.Defaults.override({ log })
    )

    await deleteCertificateExecutor({ CertificateArn })

    log.debug(`Delete certificate has been deleted`)
  } catch (error) {
    log.debug(`Failed to delete certificate`)

    throw error
  }
}

export default deleteCertificate
