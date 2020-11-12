import Lambda from 'aws-sdk/clients/lambda'

import { Log, Options, retry, getLog } from '../utils'

export const LambdaDefaults = {
  MEMORY_SIZE: 512,
  TIMEOUT: 900,
  RUNTIME: 'nodejs12.x'
}

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
    Publish
  } = params

  const Tags = { ...RawTags, Owner: 'reimagined' }

  const lambda = new Lambda({ region: Region })

  const addFunction = retry(lambda, lambda.createFunction, Options.Defaults.override({ log }))

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
    Publish
  })

  if (FunctionArn == null) {
    throw new Error('Unknown function ARN')
  }

  return {
    FunctionArn,
    Version
  }
}

export default createFunction
