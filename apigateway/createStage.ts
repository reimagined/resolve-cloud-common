import ApiGatewayV2 from 'aws-sdk/clients/apigatewayv2'

import { retry, Options, getLog, Log } from '../utils'

const createStage = async (
  params: {
    ApiId: string
    StageName: string
    Region: string
    Description?: string
    AutoDeploy?: boolean
    Tags?: Record<string, string>
  },
  log: Log = getLog('CREATE-STAGE')
): Promise<void> => {
  const { ApiId, Region, StageName, AutoDeploy = true, Description, Tags } = params
  const gateway = new ApiGatewayV2({ region: Region })

  const createStageExecutor = retry(
    gateway,
    gateway.createStage,
    Options.Defaults.override({ log, expectedErrors: ['ConflictException', 'NotFoundException'] })
  )

  try {
    log.debug(`Create stage "${StageName}"`)

    await createStageExecutor({
      ApiId,
      StageName,
      AutoDeploy,
      Description,
      Tags
    })

    log.debug(`Stage "${StageName}" has been created`)
  } catch (error) {
    log.error(`Failed to create "${StageName}"`)
    throw error
  }
}

export default createStage
