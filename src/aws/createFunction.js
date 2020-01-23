const Lambda = require('aws-sdk/clients/lambda')

// const {
//   LAMBDA_DEFAULTS: { MEMORY_SIZE, RUNTIME, TIMEOUT }
// } = require('../constants')

const MEMORY_SIZE = 512
const RUNTIME= 'nodejs10.x'
const TIMEOUT = 900

const { retry, Options } = require('../utils')

const createFunction = async options => {
  const {
    FunctionName,
    Description,
    Handler,
    RoleArn,
    S3Bucket,
    S3Key,
    Region,
    Variables,
    Runtime = RUNTIME,
    Timeout = TIMEOUT,
    MemorySize = MEMORY_SIZE
  } = options

  const lambda = new Lambda({ region: Region })

  const createLambdaFunction = retry(lambda, lambda.createFunction, Options.Defaults.override({
    maxAttempts: 5,
    delay: 3000
  }))

  try {
    return await createLambdaFunction({
      FunctionName,
      Handler,
      Role: RoleArn,
      Runtime,
      Code: {
        S3Bucket,
        S3Key
      },
      Timeout,
      MemorySize,
      Tags: {
        Owner: 'reimagined'
      },
      Description,
      Environment: Variables ? { Variables } : {}
    })
  } catch (error) {
    if (error.code !== 'ResourceConflictException') {
      throw error
    }
    return null
  }
}

module.exports = createFunction
