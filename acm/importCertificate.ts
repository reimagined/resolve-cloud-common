import ACM from 'aws-sdk/clients/acm'

import { retry, Options, getLog, Log, NotFoundError } from '../utils'

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
  ): Promise<string>
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

    const { CertificateArn: ImportedCertificateArn } = await importCertificateExecutor({
      Certificate,
      PrivateKey,
      CertificateArn,
      CertificateChain
    })

    if (ImportedCertificateArn == null) {
      throw new NotFoundError('Imported certificate was not found', 'ResourceNotFoundException')
    }

    log.debug(`Certificate import successful`)

    return ImportedCertificateArn
  } catch (error) {
    log.debug(`Failed to import certificate`)

    throw error
  }
}

export default importCertificate
