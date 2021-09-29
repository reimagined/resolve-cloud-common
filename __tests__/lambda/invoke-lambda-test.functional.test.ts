import { execSync } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import AWS from 'aws-sdk'

import ensureRoleWithPolicy from '../../iam/ensureRoleWithPolicy'
import createFunction from '../../lambda/createFunction'
import deleteFunctionWithRole from '../../lambda/deleteFunctionWithRole'
import getFunctionConfiguration from '../../lambda/getFunctionConfiguration'
import invokeFunction from '../../lambda/invokeFunction'

jest.setTimeout(1000 * 60 * 5)

AWS.config.update({
  accessKeyId: process.env.DEV_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.DEV_AWS_SECRET_ACCESS_KEY
})

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const retry = async (callback: () => Promise<void>) => {
  for (let index = 20; index >= 0; index--) {
    try {
      await callback()
      break
    } catch (error) {
      if (index === 0) {
        throw error
      }
      await delay(1000)
    }
  }
}

describe('method "invokeFunction" should call the lambda', () => {
  const functionDirectoryPath = path.join(__dirname, 'invoke-lambda-test')
  const functionZipPath = path.join(__dirname, 'invoke-lambda-test.zip')

  execSync(`zip -r -9  --quiet ${JSON.stringify(functionZipPath)} .`, {
    cwd: functionDirectoryPath
  })

  const description = 'resolve-cloud-common tests. Method "invokeFunction"'
  const tags = {
    'resolve-cloud-common-tests': 'true'
  }

  let roleArn: string
  let functionArn: string

  const region = 'eu-central-1'
  const policyName = `resolve-cloud-common-invoke-function-test-p`
  const roleName = `resolve-cloud-common-invoke-function-test-r`
  const functionName = `resolve-cloud-common-invoke-function-test`

  const zipFile = fs.readFileSync(functionZipPath)

  beforeAll(async () => {
    await deleteFunctionWithRole({
      Region: region,
      FunctionName: functionName,
      IfExists: true
    })

    roleArn = await ensureRoleWithPolicy({
      Region: region,
      RoleName: roleName,
      Description: description,
      Tags: tags,
      PolicyName: policyName,
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: ['lambda.amazonaws.com'] },
            Action: 'sts:AssumeRole'
          }
        ]
      },
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: '*',
            Resource: '*'
          }
        ]
      }
    })

    void ({ FunctionArn: functionArn } = await createFunction({
      Region: region,
      FunctionName: functionName,
      Tags: tags,
      Handler: 'index.handler',
      ZipFile: zipFile,
      Description: description,
      RoleArn: roleArn,
      MemorySize: 256,
      Runtime: 'nodejs12.x',
      Timeout: 15 * 60
    }))
  })

  afterAll(async () => {
    try {
      fs.unlinkSync(functionZipPath)
    } catch {
      void 0
    }

    await deleteFunctionWithRole({
      Region: region,
      FunctionName: functionArn,
      IfExists: true
    })
  })

  test('and increment the counter to 1', async () => {
    const envKey = `resolve`

    await invokeFunction({
      Region: region,
      FunctionName: functionName,
      Payload: {
        delayTime: 0,
        envKey
      },
      MaximumExecutionDuration: 10000
    })

    await retry(async () => {
      const { Environment: { Variables = {} } = { Variables: {} } } =
        await getFunctionConfiguration({
          Region: region,
          FunctionName: functionName
        })

      expect(+Variables[envKey]).toEqual(1)
    })
  })

  test('and increment the counter to 2', async () => {
    const envKey = `resolve`

    await invokeFunction({
      Region: region,
      FunctionName: functionName,
      Payload: {
        delayTime: 0,
        envKey
      },
      MaximumExecutionDuration: 10000
    })

    await retry(async () => {
      const { Environment: { Variables = {} } = { Variables: {} } } =
        await getFunctionConfiguration({
          Region: region,
          FunctionName: functionName
        })

      expect(+Variables[envKey]).toEqual(2)
    })
  })

  test('throw TimeoutError and increment the counter to 3', async () => {
    const envKey = `resolve`

    try {
      await invokeFunction({
        Region: region,
        FunctionName: functionName,
        Payload: {
          delayTime: 1000,
          envKey
        },
        MaximumExecutionDuration: 1000
      })
      throw new Error(`Test failed`)
    } catch (error) {
      expect(`${error}`).toContain('Timeout')
    }

    await retry(async () => {
      const { Environment: { Variables = {} } = { Variables: {} } } =
        await getFunctionConfiguration({
          Region: region,
          FunctionName: functionName
        })

      expect(+Variables[envKey]).toEqual(3)
    })
  })
})
