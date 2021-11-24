import Lambda from 'aws-sdk/clients/lambda'

import { Log, Options, retry, getLog } from '../utils'
import getFunctionConfiguration from './getFunctionConfiguration'

export const LambdaDefaults = {
  MEMORY_SIZE: 512,
  TIMEOUT: 900,
  RUNTIME: 'nodejs14.x'
}

const MAX_ATTEMPTS = 180
const ATTEMPT_TIMEOUT = 1000

async function createFunction(
  params: {
    Region: string
    FunctionName: string
    Description?: string
    Handler: string
    RoleArn: string
    S3Bucket?: string
    S3Key?: string
    ZipFile?: Buffer
    Variables?: Record<string, string>
    Tags: Record<string, string>
    Runtime: string
    Timeout: number
    MemorySize: number
    Layers?: Array<string>
    Publish?: boolean
    VpcConfig?: { SubnetIds: Array<string>; SecurityGroupIds: Array<string> }
  },
  log: Log = getLog('CREATE-FUNCTION')
): Promise<{
  FunctionArn: string
  Version?: string
}> {
  const {
    Region,
    FunctionName,
    Description,
    Handler,
    RoleArn,
    S3Bucket,
    S3Key,
    ZipFile,
    Layers,
    Variables,
    Tags: RawTags = {},
    Runtime = LambdaDefaults.RUNTIME,
    Timeout = LambdaDefaults.TIMEOUT,
    MemorySize = LambdaDefaults.MEMORY_SIZE,
    Publish,
    VpcConfig
  } = params

  const Tags = { ...RawTags, Owner: 'reimagined' }

  const lambda = new Lambda({ region: Region })

  const addFunction = retry(
    lambda,
    lambda.createFunction,
    Options.Defaults.override({ log, maxAttempts: 30 })
  )

  const { FunctionArn, Version } = await addFunction({
    FunctionName,
    Handler,
    Role: RoleArn,
    Runtime,
    Code: {
      S3Bucket,
      S3Key,
      ZipFile
    },
    Timeout,
    MemorySize,
    Tags,
    Description,
    Environment:
      Variables != null
        ? {
            Variables
          }
        : undefined,
    Layers,
    Publish,
    VpcConfig
  })

  if (FunctionArn == null) {
    throw new Error('Unknown function ARN')
  }

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const { State } = await getFunctionConfiguration({
      Region,
      FunctionName: FunctionArn
    })

    if (State != null && State !== 'Pending') {
      break
    }

    log.verbose(`Lambda is pending [${i}/${MAX_ATTEMPTS}]`)
    await new Promise((resolve) => setTimeout(resolve, ATTEMPT_TIMEOUT))
  }

  return {
    FunctionArn,
    Version
  }
}

export default createFunction
