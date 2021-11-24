import updateFunctionConfiguration from './updateFunctionConfiguration'
import { getLog, Log } from '../utils'

async function updateFunctionVpcConfig(
  params: {
    Region: string
    FunctionName: string
    VpcConfig: { SubnetIds: Array<string>; SecurityGroupIds: Array<string> }
  },
  log: Log = getLog('UPDATE-FUNCTION-VPC-CONFIG')
): Promise<void> {
  const { Region, VpcConfig, FunctionName } = params

  try {
    log.debug(`Update function "${FunctionName}" VPC config`)
    await updateFunctionConfiguration({
      Region,
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
