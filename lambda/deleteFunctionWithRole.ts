import { getLog, Log, ignoreNotFoundException } from '../utils'

import deleteRole from '../iam/deleteRole'
import getFunctionRole from './getFunctionRole'
import deleteFunction from './deleteFunction'

const deleteFunctionWithRole = async (
  params: {
    Region: string
    FunctionName: string
    IfExists?: boolean
  },
  log: Log = getLog(`DELETE-FUNCTION-WITH-ROLE`)
): Promise<void> => {
  const { Region, FunctionName, IfExists } = params

  let RoleName: string | undefined

  try {
    const RoleArn = await getFunctionRole({ Region, FunctionName }, log)
    const parsedRoleArn = RoleArn.split('/')
    RoleName = parsedRoleArn[parsedRoleArn.length - 1]
  } catch (error) {
    if (IfExists) {
      ignoreNotFoundException(error)
    } else {
      throw error
    }
  }

  await deleteFunction({ Region, FunctionName, IfExists }, log)

  if (RoleName != null) {
    await deleteRole({ Region, RoleName, IfExists }, log)
  }
}

export default deleteFunctionWithRole
