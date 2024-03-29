import Lambda from 'aws-sdk/clients/lambda'
import Resourcegroupstaggingapi from 'aws-sdk/clients/resourcegroupstaggingapi'

import { retry, Options, getLog, Log, ignoreNotFoundException } from '../utils'

const deleteFunction = async (
  params: {
    Region: string
    FunctionName: string
    IfExists?: boolean
  },
  log: Log = getLog(`DELETE-FUNCTION`)
): Promise<void> => {
  const { Region, FunctionName, IfExists = false } = params

  const lambda = new Lambda({ region: Region })
  const taggingApi = new Resourcegroupstaggingapi({ region: Region })

  try {
    log.debug(`Delete the function "${FunctionName}"`)
    const removeFunction = retry(
      lambda,
      lambda.deleteFunction,
      Options.Defaults.override({
        log,
        expectedErrors: ['ResourceNotFoundException', 'InvalidParameterValueException'],
        toleratedErrors: ['ResourceConflictException']
      })
    )

    const getFunction = retry(
      lambda,
      lambda.getFunction,
      Options.Defaults.override({
        log,
        expectedErrors: ['ResourceNotFoundException', 'InvalidParameterValueException'],
        toleratedErrors: ['ResourceConflictException']
      })
    )

    const untagResources = retry(
      taggingApi,
      taggingApi.untagResources,
      Options.Defaults.override({
        log
      })
    )

    const { Tags, Configuration: { FunctionArn } = {} } = await getFunction({
      FunctionName
    })
    const TagKeys: Array<string> = Tags != null ? Object.keys(Tags) : []

    await removeFunction({
      FunctionName
    })

    try {
      if (TagKeys.length > 0 && FunctionArn != null) {
        await untagResources({
          ResourceARNList: [FunctionArn],
          TagKeys
        })
        log.debug(`Function tags has been deleted`)
      }
    } catch (error) {
      log.warn(error)
    }

    log.debug(`The function "${FunctionName}" has been deleted`)
  } catch (error) {
    if (IfExists) {
      log.error(`Skip delete the function "${FunctionName}"`)
      ignoreNotFoundException(error)
    } else {
      log.error(`Failed to delete the function "${FunctionName}"`)
      throw error
    }
  }
}

export default deleteFunction
