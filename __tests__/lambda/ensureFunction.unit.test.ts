import Lambda from 'aws-sdk/clients/lambda'

import { mockedSdkFunction } from '../mockedSdkFunction'
import ensureFunction from '../../lambda/ensureFunction'

jest.mock('../../utils')

const mockPutFunctionEventInvokeConfig = mockedSdkFunction(
  Lambda.prototype.putFunctionEventInvokeConfig
)
const mockUpdateFunctionCode = mockedSdkFunction(Lambda.prototype.updateFunctionCode)
const mockCreateFunction = mockedSdkFunction(Lambda.prototype.createFunction)
const mockListTags = mockedSdkFunction(Lambda.prototype.listTags)
const mockTagResource = mockedSdkFunction(Lambda.prototype.tagResource)
const mockUntagResource = mockedSdkFunction(Lambda.prototype.untagResource)
const mockDeleteFunctionConcurrency = mockedSdkFunction(Lambda.prototype.deleteFunctionConcurrency)
const mockPutFunctionConcurrency = mockedSdkFunction(Lambda.prototype.putFunctionConcurrency)
const mockUpdateFunctionConfiguration = mockedSdkFunction(
  Lambda.prototype.updateFunctionConfiguration
)
const mockGetFunctionConfiguration = mockedSdkFunction(Lambda.prototype.getFunctionConfiguration)

describe('ensureFunction', () => {
  afterEach(() => {
    mockUpdateFunctionCode.mockClear()
    mockCreateFunction.mockClear()
    mockListTags.mockClear()
    mockTagResource.mockClear()
    mockUntagResource.mockClear()
    mockDeleteFunctionConcurrency.mockClear()
    mockPutFunctionConcurrency.mockClear()
    mockUpdateFunctionConfiguration.mockClear()
    mockPutFunctionEventInvokeConfig.mockClear()
    mockGetFunctionConfiguration.mockClear()
  })
  test('should function has been ensure', async () => {
    mockGetFunctionConfiguration.mockResolvedValue({
      State: 'Active',
      LastUpdateStatus: 'Successful'
    })
    mockUpdateFunctionConfiguration.mockResolvedValue({ FunctionArn: 'functionArn' })
    mockUpdateFunctionCode.mockResolvedValue({ Version: 'version' })
    mockListTags.mockResolvedValue({
      Tags: {
        tag1: 'tag1',
        tag2: 'tag2'
      }
    })
    mockTagResource.mockResolvedValue({})
    mockUntagResource.mockResolvedValue({})
    mockPutFunctionEventInvokeConfig.mockResolvedValue({})

    const result = await ensureFunction({
      Region: 'region',
      FunctionName: 'functionName',
      Description: 'description',
      Handler: 'handler',
      RoleArn: 'roleArn',
      S3Bucket: 's3Bucket',
      S3Key: 's3Key'
    })

    expect(mockUpdateFunctionCode).toHaveBeenCalledWith({
      FunctionName: 'functionName',
      S3Bucket: 's3Bucket',
      S3Key: 's3Key'
    })
    expect(mockListTags).toHaveBeenCalledWith({ Resource: 'functionArn' })
    expect(mockTagResource).toHaveBeenCalledWith({
      Resource: 'functionArn',
      Tags: { Owner: 'reimagined' }
    })
    expect(mockUntagResource).toHaveBeenCalledWith({
      Resource: 'functionArn',
      TagKeys: ['tag1', 'tag2']
    })
    expect(mockPutFunctionEventInvokeConfig).toHaveBeenCalled()
    expect(mockPutFunctionConcurrency).toHaveBeenCalled()
    expect(mockDeleteFunctionConcurrency).toHaveBeenCalled()
    expect(result).toEqual({ FunctionArn: 'functionArn', Version: 'version' })
  })

  test('should failed to ensure function', async () => {
    mockGetFunctionConfiguration.mockResolvedValue({
      State: 'Active',
      LastUpdateStatus: 'Successful'
    })
    mockUpdateFunctionConfiguration.mockRejectedValue(new Error())
    try {
      await ensureFunction({
        Region: 'region',
        FunctionName: 'functionName',
        Description: 'description',
        Handler: 'handler',
        RoleArn: 'roleArn',
        S3Bucket: 's3Bucket',
        S3Key: 's3Key'
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test('should function has been created with ARN', async () => {
    const error: Error & { code?: string } = new Error()
    error.code = 'ResourceNotFoundException'
    mockGetFunctionConfiguration.mockResolvedValue({
      State: 'Active',
      LastUpdateStatus: 'Successful'
    })
    mockUpdateFunctionConfiguration.mockRejectedValue(error)
    mockCreateFunction.mockResolvedValue({ FunctionArn: 'functionArn', Version: 'version' })
    const result = await ensureFunction({
      Region: 'region',
      FunctionName: 'functionName',
      Description: 'description',
      Handler: 'handler',
      RoleArn: 'roleArn',
      S3Bucket: 's3Bucket',
      S3Key: 's3Key'
    })
    expect(mockCreateFunction).toHaveBeenCalledWith({
      Code: {
        S3Bucket: 's3Bucket',
        S3Key: 's3Key'
      },
      Description: 'description',
      FunctionName: 'functionName',
      Handler: 'handler',
      Role: 'roleArn',
      MemorySize: 512,
      Layers: undefined,
      Runtime: 'nodejs14.x',
      Tags: {
        Owner: 'reimagined'
      },
      Timeout: 900
    })
    expect(result).toEqual({ FunctionArn: 'functionArn', Version: 'version' })
  })

  test('should failed "Unknown function ARN"', async () => {
    const err: Error & { code?: string } = new Error()
    err.code = 'ResourceNotFoundException'
    mockUpdateFunctionConfiguration.mockRejectedValue(err)
    mockCreateFunction.mockResolvedValue({})
    mockGetFunctionConfiguration.mockResolvedValue({
      State: 'Active',
      LastUpdateStatus: 'Successful'
    })
    try {
      await ensureFunction({
        Region: 'region',
        FunctionName: 'functionName',
        Description: 'description',
        Handler: 'handler',
        RoleArn: 'roleArn',
        S3Bucket: 's3Bucket',
        S3Key: 's3Key'
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
