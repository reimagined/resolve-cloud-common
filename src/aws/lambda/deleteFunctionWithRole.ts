import { Log } from '../../utils'

import deleteRole from '../iam/deleteRole'
import getFunctionRole from './getFunctionRole'
import deleteFunction from './deleteFunction'

interface TMethod {
  (
    params: {
      Region: string
      FunctionName: string
    },
    log?: Log
  ): Promise<void>
}

const deleteFunctionWithRole: TMethod = async ({ Region, FunctionName }, log) => {
  const RoleArn = await getFunctionRole({ Region, FunctionName }, log)
  const parsedRoleArn = RoleArn.split('/')
  const RoleName = parsedRoleArn[parsedRoleArn.length - 1]

  await deleteFunction({ Region, FunctionName }, log)
  await deleteRole({ Region, RoleName }, log)
}

export default deleteFunctionWithRole
