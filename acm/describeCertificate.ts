import ACM, { CertificateDetail } from 'aws-sdk/clients/acm'

import { retry, Options, getLog, Log, NotFoundError } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      CertificateArn: string
    },
    log?: Log
  ): Promise<CertificateDetail>
}

const describeCertificate: TMethod = async (
  { Region, CertificateArn },
  log = getLog('DESCRIBE-CERTIFICATE')
) => {
  const acm = new ACM({ region: Region })

  try {
    log.debug(`Get describe certificate`)

    const describeCertificateExecutor = retry(
      acm,
      acm.describeCertificate,
      Options.Defaults.override({ log })
    )

    const { Certificate } = await describeCertificateExecutor({ CertificateArn })

    if (Certificate == null) {
      throw new NotFoundError('Certificate was not found', 'ResourceNotFoundException')
    }

    log.debug(`Describe certificate have been got`)

    return Certificate
  } catch (error) {
    log.debug(`Failed to get describe certificate`)

    throw error
  }
}

export default describeCertificate
