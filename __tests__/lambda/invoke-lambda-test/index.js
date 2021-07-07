const Lambda = require('aws-sdk/clients/lambda')

const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME

exports.handler = async ({ delayTime, envKey }) => {
  await new Promise(
    resolve => setTimeout(resolve, delayTime)
  )

  const lambda  = new Lambda()

  const { Environment: { Variables = {} } = { Variables: {} } } = await lambda.getFunctionConfiguration({
    FunctionName: functionName,
    Qualifier: '$LATEST'
  }).promise()

  await lambda.updateFunctionConfiguration({
    FunctionName: functionName,
    Environment: {
      Variables: {
        ...Variables,
        [envKey]: `${~~Variables[envKey] + 1}`
      }
    }
  }).promise()
};
