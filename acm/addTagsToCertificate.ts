import ACM from 'aws-sdk/clients/acm'

import { retry, Options, getLog, Log } from '../utils'

const addTagsToCertificate = async (
  params: {
    Region: string
    CertificateArn: string
    Tags: Record<string, string>
  },
  log: Log = getLog('ADD-TAGS-TO-CERTIFICATE')
): Promise<void> => {
  const { Region, CertificateArn, Tags } = params

  Tags.Owner = 'reimagined'

  const acm = new ACM({ region: Region })

  try {
    log.debug(`Add tags to certificate`)

    const addTagsToCertificateExecutor = retry(
      acm,
      acm.addTagsToCertificate,
      Options.Defaults.override({ log })
    )

    await addTagsToCertificateExecutor({
      CertificateArn,
      Tags: Object.entries(Tags).map(([Key, Value]) => ({ Key, Value }))
    })

    log.debug(`Tags has been added to the certificate`)
  } catch (error) {
    log.debug(`Failed to add tags to the certificate`)

    throw error
  }
}

export default addTagsToCertificate
