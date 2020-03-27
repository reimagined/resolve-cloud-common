import ACM from 'aws-sdk/clients/acm'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      Certificate: string
      PrivateKey: string
      CertificateArn?: string
      CertificateChain?: string
    },
    log?: Log
  ): Promise<any>
}

const importCertificate: TMethod = async (
  { Region, Certificate, PrivateKey, CertificateArn, CertificateChain },
  log = getLog('IMPORT-CERTIFICATE')
) => {
  const acm = new ACM({ region: Region })

  try {
    log.debug(`Import certificate`)

    const importCertificateExecutor = retry(
      acm,
      acm.importCertificate,
      Options.Defaults.override({ log })
    )

    const importResult = await importCertificateExecutor({
      Certificate,
      PrivateKey,
      CertificateArn,
      CertificateChain
    })

    log.debug(`Certificate import successful`)

    return importResult
  } catch (error) {
    log.debug(`Failed to import certificate`)

    throw error
  }
}

export default importCertificate
