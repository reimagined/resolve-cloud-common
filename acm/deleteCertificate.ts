import ACM from 'aws-sdk/clients/acm'
import Resourcegroupstaggingapi from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteCertificate = async (
  params: {
    Region: string
    CertificateArn: string
    IfExists?: boolean
  },
  log: Log = getLog('DELETE-CERTIFICATE')
): Promise<void> => {
  const { Region, CertificateArn, IfExists } = params

  const acm = new ACM({ region: Region })
  const taggingApi = new Resourcegroupstaggingapi({ region: Region })

  try {
    log.debug(`Delete certificate`)

    const deleteCertificateExecutor = retry(
      acm,
      acm.deleteCertificate,
      Options.Defaults.override({ log })
    )

    const listTagsForCertificate = retry(
      acm,
      acm.listTagsForCertificate,
      Options.Defaults.override({ log })
    )

    const untagResources = retry(
      taggingApi,
      taggingApi.untagResources,
      Options.Defaults.override({ log })
    )

    log.debug(`List tags certificate`)

    const { Tags } = await listTagsForCertificate({
      CertificateArn
    })

    await deleteCertificateExecutor({ CertificateArn })

    try {
      if (Tags != null) {
        const tagKeys = Tags.map(({ Key }) => Key)

        await untagResources({
          TagKeys: tagKeys,
          ResourceARNList: [CertificateArn]
        })
        log.debug(`Certificate tags has been deleted`)
        log.verbose({ tagKeys })
      }
    } catch (error) {
      log.warn(error)
    }

    log.debug(`Delete certificate has been deleted`)
  } catch (error) {
    if (IfExists) {
      log.debug(`Skip delete the certificate "${CertificateArn}"`)
      ignoreNotFoundException(error)
    } else {
      log.debug(`Failed to delete the certificate "${CertificateArn}"`)
      throw error
    }
  }
}

export default deleteCertificate
