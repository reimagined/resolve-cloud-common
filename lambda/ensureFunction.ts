import Lambda from 'aws-sdk/clients/lambda'

import { retry, Options, getLog, Log } from '../utils'

import setFunctionConcurrency from './setFunctionConcurrency'
import deleteFunctionConcurrency from './deleteFunctionConcurrency'

const LambdaDefaults = {
  MEMORY_SIZE: 512,
  TIMEOUT: 900,
  RUNTIME: 'nodejs10.x',
}

async function setupFunctionEventInvokeConfig(
  params: {
    Region: string
    FunctionName: string
  },
  log: Log
): Promise<void> {
  const { Region, FunctionName } = params

  const lambda = new Lambda({ region: Region })

  const putFunctionEventInvokeConfig = retry(
    lambda,
    lambda.putFunctionEventInvokeConfig,
    Options.Defaults.override({ log, silent: true, maxAttempts: 1 })
  )

  await putFunctionEventInvokeConfig({
    FunctionName,
    MaximumEventAgeInSeconds: 21600,
    MaximumRetryAttempts: 0,
  })
}

async function updateFunctionCode(
  params: {
    Region: string
    FunctionName: string
    S3Bucket: string
    S3Key: string
    Publish?: boolean
  },
  log: Log
): Promise<string> {
  const { Region, FunctionName, S3Bucket, S3Key, Publish } = params

  const lambda = new Lambda({ region: Region })

  const setFunctionCode = retry(
    lambda,
    lambda.updateFunctionCode,
    Options.Defaults.override({ log, silent: true, maxAttempts: 1 })
  )

  const { Version } = await setFunctionCode({
    FunctionName,
    S3Bucket,
    S3Key,
    Publish,
  })

  if (Version == null) {
    throw new Error('Unknown function version')
  }

  return Version
}

async function createFunction(
  params: {
    Region: string
    FunctionName: string
    Description?: string
    Handler: string
    RoleArn: string
    S3Bucket: string
    S3Key: string
    Environment?: object
    Tags: { [key: string]: string }
    Runtime: string
    Timeout: number
    MemorySize: number
    Layers?: Array<string>
    Publish?: boolean
  },
  log: Log
): Promise<TResponse> {
  const {
    Region,
    FunctionName,
    Description,
    Handler,
    RoleArn,
    S3Bucket,
    S3Key,
    Environment,
    Tags,
    Runtime,
    Timeout,
    MemorySize,
    Layers,
    Publish,
  } = params

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
    },
    Timeout,
    MemorySize,
    Tags,
    Description,
    Environment,
    Layers,
    Publish,
  })

  if (FunctionArn == null) {
    throw new Error('Unknown function ARN')
  }

  return {
    FunctionArn,
    Version,
  }
}

async function listTags(
  params: {
    Region: string
    Resource: string
  },
  log: Log
): Promise<{ [key: string]: string } | undefined> {
  const { Region, Resource } = params

  const lambda = new Lambda({ region: Region })

  const getTags = retry(
    lambda,
    lambda.listTags,
    Options.Defaults.override({ log, silent: true, maxAttempts: 1 })
  )
  const { Tags } = await getTags({
    Resource,
  })

  return Tags
}

async function tagResource(
  params: {
    Region: string
    Resource: string
    Tags: { [key: string]: string }
  },
  log: Log
): Promise<void> {
  const { Region, Resource, Tags } = params

  const lambda = new Lambda({ region: Region })

  const setTags = retry(
    lambda,
    lambda.tagResource,
    Options.Defaults.override({ log, silent: true, maxAttempts: 1 })
  )
  await setTags({
    Resource,
    Tags,
  })
}

async function untagResource(
  params: { Region: string; Resource: string; TagKeys: Array<string> },
  log: Log
): Promise<void> {
  const { Region, Resource, TagKeys } = params

  const lambda = new Lambda({ region: Region })

  const unsetTags = retry(
    lambda,
    lambda.untagResource,
    Options.Defaults.override({ log, silent: true, maxAttempts: 1 })
  )
  await unsetTags({
    Resource,
    TagKeys,
  })
}

interface TResponse {
  FunctionArn: string
  Version?: string
}

interface TMethod {
  (
    params: {
      Region: string
      FunctionName: string
      Description?: string
      Handler: string
      RoleArn: string
      S3Bucket: string
      S3Key: string | null
      Variables?: { [key: string]: string }
      Tags?: { [key: string]: string }
      Runtime?: string
      Timeout?: number
      MemorySize?: number
      Layers?: Array<string>
      Publish?: boolean
    },
    log?: Log
  ): Promise<TResponse>
}

const ensureFunction: TMethod = async (
  {
    Region,
    FunctionName,
    Description,
    Handler,
    RoleArn,
    S3Bucket,
    S3Key,
    Layers,
    Variables,
    Tags: RawTags = {},
    Runtime = LambdaDefaults.RUNTIME,
    Timeout = LambdaDefaults.TIMEOUT,
    MemorySize = LambdaDefaults.MEMORY_SIZE,
    Publish,
  },
  log: Log = getLog('ENSURE-FUNCTION')
) => {
  const Tags = { ...RawTags, Owner: 'reimagined' }
  const Environment = Variables
    ? {
        Variables: Object.keys(Variables).reduce((acc: { [key: string]: string }, key: string) => {
          acc[key] = `${Variables[key]}`
          return acc
        }, {}),
      }
    : undefined

  log.verbose({
    FunctionName,
    Description,
    Handler,
    RoleArn,
    S3Bucket,
    S3Key,
    Region,
    Variables,
    Tags,
    Runtime,
    Timeout,
    MemorySize,
    Layers,
  })

  try {
    log.debug(`Update function configuration`)

    const lambda = new Lambda({ region: Region })
    let FunctionVersion

    if (S3Key != null) {
      log.debug(`Update function code`)

      FunctionVersion = await updateFunctionCode(
        {
          Region,
          FunctionName,
          S3Bucket,
          S3Key,
          Publish,
        },
        log
      )
      log.debug(`Function code has been updated`)
    } else {
      log.debug(`Function code is not changed`)
    }

    await setFunctionConcurrency(
      {
        Region,
        FunctionName,
        Concurrency: 0,
      },
      log
    )

    await deleteFunctionConcurrency(
      {
        Region,
        FunctionName,
      },
      log
    )

    const updateFunctionConfiguration = retry(
      lambda,
      lambda.updateFunctionConfiguration,
      Options.Defaults.override({ log, silent: true })
    )

    const { FunctionArn } = await updateFunctionConfiguration({
      Description,
      FunctionName,
      Handler,
      MemorySize,
      Role: RoleArn,
      Runtime,
      Timeout,
      Environment,
      Layers,
    })

    if (FunctionArn == null) {
      const error: Error & { code?: string } = new Error('Unknown function ARN')
      error.code = 'ResourceNotFoundException'
      throw error
    }

    log.debug(`Function configuration has been updated`)

    log.debug(`Update function event invoke config`)
    await setupFunctionEventInvokeConfig(
      {
        Region,
        FunctionName,
      },
      log
    )
    log.debug(`Function event invoke config has been updated`)

    log.debug(`Find tags`)

    const prevTags = await listTags(
      {
        Region,
        Resource: FunctionArn,
      },
      log
    )
    log.debug(`Tags have been found`)

    const nextTags: { [key: string]: string } = { ...prevTags, ...Tags }
    const ensuredTags: { [key: string]: string } = {}
    const dropTags: Array<string> = []
    for (const [key, value] of Object.entries(nextTags)) {
      if (Object.prototype.hasOwnProperty.call(Tags, key)) {
        ensuredTags[key] = value
      } else {
        dropTags.push(key)
      }
    }

    log.verbose({
      prevTags,
      nextTags: Tags,
      ensuredTags,
      dropTags,
    })

    log.debug(`Update tags`)
    await tagResource(
      {
        Region,
        Resource: FunctionArn,
        Tags: ensuredTags,
      },
      log
    )
    log.debug(`Tags have been updated`)

    if (dropTags.length > 0) {
      log.debug(`Deleting tags`)
      await untagResource(
        {
          Region,
          Resource: FunctionArn,
          TagKeys: dropTags,
        },
        log
      )
      log.debug(`Tags have been deleted`)
    }

    return {
      FunctionArn,
      Version: FunctionVersion,
    }
  } catch (error) {
    if (error.code === 'ResourceNotFoundException' && S3Key != null) {
      log.debug(`Create function`)

      const { FunctionArn, Version } = await createFunction(
        {
          FunctionName,
          Description,
          Handler,
          RoleArn,
          S3Bucket,
          S3Key,
          Region,
          Environment,
          Tags,
          Runtime,
          Timeout,
          MemorySize,
          Layers,
          Publish,
        },
        log
      )

      log.debug(`Function has been created with ARN "${FunctionArn}"`)

      log.debug(`Update function event invoke config`)
      await setupFunctionEventInvokeConfig(
        {
          Region,
          FunctionName,
        },
        log
      )
      log.debug(`Function event invoke config has been updated`)

      return {
        FunctionArn,
        Version,
      }
    }
    log.debug(`Failed to ensure function`)
    throw error
  }
}

export default ensureFunction
