import ACM from 'aws-sdk/clients/acm'
import NodeRSA from 'node-rsa'

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
  const { Region, Certificate, PrivateKey, CertificateArn, CertificateChain, Tags = {} } = params

  Tags.Owner = 'reimagined'

  const acm = new ACM({ region: Region })

  try {
    log.debug(`Import certificate`)

    const importCertificateExecutor = retry(
      acm,
      acm.importCertificate,
      Options.Defaults.override({ log })
    )
    const addTagsToCertificateExecutor = retry(
      acm,
      acm.addTagsToCertificate,
      Options.Defaults.override({ log })
    )

    const keySize = new NodeRSA(PrivateKey).getKeySize()

    if (keySize !== 1024 && keySize !== 2048) {
      throw new Error('Public key length must be 1024 bits or 2048 bits')
    }

    const { CertificateArn: ImportedCertificateArn } = await importCertificateExecutor({
      Certificate,
      PrivateKey,
      CertificateArn,
      CertificateChain
    })

    if (ImportedCertificateArn == null) {
      throw new NotFoundError('Imported certificate was not found', 'ResourceNotFoundException')
    }

    // Workaround - ValidationException: Tagging is not permitted on re-import.
    await addTagsToCertificateExecutor({
      CertificateArn: ImportedCertificateArn,
      Tags: Object.entries(Tags).map(([Key, Value]) => ({
        Key,
        Value
      }))
    })

    log.debug(`Certificate import successful`)

    return ImportedCertificateArn
  } catch (error) {
    log.debug(`Failed to import certificate`)

    throw error
  }
}

export default importCertificate
