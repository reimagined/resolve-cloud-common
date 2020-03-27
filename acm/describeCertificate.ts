import ACM from 'aws-sdk/clients/acm'

import { retry, Options, getLog, Log } from '../utils'

interface TMethod {
  (
    params: {
      Region: string
      CertificateArn: string
    },
    log?: Log
  ): Promise<any>
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

    const describeResult = await describeCertificateExecutor({ CertificateArn })

    if (describeResult == null) {
      throw new Error('Describe certificate not found')
    }

    log.debug(`Describe certificate have been got`)

    return describeResult
  } catch (error) {
    log.debug(`Failed to get describe certificate`)

    throw error
  }
}

export default describeCertificate
