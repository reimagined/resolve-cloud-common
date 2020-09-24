import ACM from 'aws-sdk/clients/acm'

import { retry, Options, getLog, Log, NotFoundError } from '../utils'

const importCertificate = async (
  params: {
    Region: string
    Certificate: string
    PrivateKey: string
    CertificateArn?: string
    CertificateChain?: string
    Tags?: Record<string, string>
  },
  log: Log = getLog('IMPORT-CERTIFICATE')
): Promise<string> => {
  const { Region, Certificate, PrivateKey, CertificateArn, CertificateChain, Tags } = params

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
      CertificateChain,
      Tags:
        Tags != null
          ? Object.entries(Tags).map(([Key, Value]) => ({
              Key,
              Value
            }))
          : undefined
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
