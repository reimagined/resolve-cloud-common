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

    try {
      log.debug(`List tags certificate`)
      const listTagsForCertificate = retry(
        acm,
        acm.listTagsForCertificate,
        Options.Defaults.override({ log })
      )

      const { Tags } = await listTagsForCertificate({
        CertificateArn
      })

      if (Tags != null) {
        const untagResources = retry(
          taggingApi,
          taggingApi.untagResources,
          Options.Defaults.override({ log })
        )

        const tagKeys = Tags.map(({ Key }) => Key)

        await untagResources({
          TagKeys: tagKeys,
          ResourceARNList: [CertificateArn]
        })
        log.debug(`Certificate tags has been deleted`)
        log.verbose({ tagKeys })
      }
    } catch (listTagsError) {
      ignoreNotFoundException(listTagsError)
    }

    try {
      const deleteCertificateExecutor = retry(
        acm,
        acm.deleteCertificate,
        Options.Defaults.override({ log })
      )

      await deleteCertificateExecutor({ CertificateArn })

      log.debug(`Delete certificate has been deleted`)
    } catch (deleteCertificateError) {
      if (IfExists) {
        ignoreNotFoundException(deleteCertificateError)
      } else {
        throw deleteCertificateError
      }
    }
  } catch (error) {
    log.debug(`Failed to delete certificate`)

    throw error
  }
}

export default deleteCertificate
