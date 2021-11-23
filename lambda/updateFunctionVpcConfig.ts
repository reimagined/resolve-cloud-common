import Lambda from 'aws-sdk/clients/lambda'
import { getLog, Log, Options, retry } from '../utils'

async function updateFunctionVpcConfig(
  params: {
    Region: string
    FunctionName: string
    VpcConfig: { SubnetIds: Array<string>; SecurityGroupIds: Array<string> }
  },
  log: Log = getLog('UPDATE-FUNCTION-VPC-CONFIG')
): Promise<void> {
  const { Region, VpcConfig, FunctionName } = params

  const lambda = new Lambda({
    region: Region
  })

  const updateFunctionConfiguration = retry(
    lambda,
    lambda.updateFunctionConfiguration,
    Options.Defaults.override({ log, silent: true, maxAttempts: 50 })
  )

  try {
    log.debug(`Update function "${FunctionName}" VPC config`)
    await updateFunctionConfiguration({
      FunctionName,
      VpcConfig
    })
  } catch (error) {
    log.debug(`Failed to update function "${FunctionName}" VPC config`)
    throw error
  }

  log.debug(`The function "${FunctionName}" VPC config has been updated`)
}

export default updateFunctionVpcConfig
