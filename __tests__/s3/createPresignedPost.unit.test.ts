import S3 from 'aws-sdk/clients/s3'
import { mocked } from 'ts-jest/utils'

import createPresignedPost from '../../s3/createPresignedPost'

const mockS3 = mocked(S3.prototype.constructor.prototype, true)

describe('createPresignedPost', () => {
  afterEach(() => {
    mockS3.createPresignedPost.mockClear()
  })
  test('should create a presigned post', async () => {
    mockS3.createPresignedPost.mockReturnValue({
      fields: {
        Policy: 'policy',
        'X-Amz-Signature': 'x-amz-signature'
      },
      url: 'url'
    })

    await createPresignedPost({
      Region: 'region',
      BucketName: 'bucket',
      Key: 'key'
    })

    expect(mockS3.createPresignedPost).toHaveBeenCalledWith({
      Bucket: 'bucket',
      Conditions: [['starts-with', '$Content-Type', '']],
      Fields: {
        Key: 'key'
      }
    })
  })

  test('should create a presigned post with expire date', async () => {
    mockS3.createPresignedPost.mockReturnValue({
      fields: {
        Policy: 'policy',
        'X-Amz-Signature': 'x-amz-signature'
      },
      url: 'url'
    })

    await createPresignedPost({
      Region: 'region',
      BucketName: 'bucket',
      Key: 'key',
      Expires: 60 // sec
    })

    expect(mockS3.createPresignedPost).toHaveBeenCalledWith({
      Bucket: 'bucket',
      Fields: {
        Key: 'key'
      },
      Conditions: [['starts-with', '$Content-Type', '']],
      Expires: 60
    })
  })

  test('should create a presigned post with content-type starts-with "image/"', async () => {
    mockS3.createPresignedPost.mockReturnValue({
      fields: {
        Policy: 'policy',
        'X-Amz-Signature': 'x-amz-signature'
      },
      url: 'url'
    })

    await createPresignedPost({
      Region: 'region',
      BucketName: 'bucket',
      Key: 'key',
      ContentType: 'image/'
    })

    expect(mockS3.createPresignedPost).toHaveBeenCalledWith({
      Bucket: 'bucket',
      Fields: {
        Key: 'key'
      },
      Conditions: [['starts-with', '$Content-Type', 'image/']]
    })
  })

  test('should create a presigned post with content-type equal "image/jpeg"', async () => {
    mockS3.createPresignedPost.mockReturnValue({
      fields: {
        Policy: 'policy',
        'X-Amz-Signature': 'x-amz-signature'
      },
      url: 'url'
    })

    await createPresignedPost({
      Region: 'region',
      BucketName: 'bucket',
      Key: 'key',
      ContentType: 'image/jpeg'
    })

    expect(mockS3.createPresignedPost).toHaveBeenCalledWith({
      Bucket: 'bucket',
      Fields: {
        Key: 'key'
      },
      Conditions: [['eq', '$Content-Type', 'image/jpeg']]
    })
  })

  test('should create a presigned post with metadata', async () => {
    mockS3.createPresignedPost.mockReturnValue({
      fields: {
        Policy: 'policy',
        'X-Amz-Signature': 'x-amz-signature'
      },
      url: 'url'
    })

    const result = await createPresignedPost({
      Region: 'region',
      BucketName: 'bucket',
      Key: 'key',
      Metadata: {
        userId: 'userId',
        deploymentId: 'deploymentId'
      }
    })

    expect(mockS3.createPresignedPost).toHaveBeenCalledWith({
      Bucket: 'bucket',
      Fields: {
        Key: 'key'
      },
      Conditions: [
        ['starts-with', '$Content-Type', ''],
        ['eq', '$x-amz-meta-userId', 'userId'],
        ['eq', '$x-amz-meta-deploymentId', 'deploymentId']
      ]
    })

    expect(result.fields['x-amz-meta-userId']).toEqual('userId')
    expect(result.fields['x-amz-meta-deploymentId']).toEqual('deploymentId')
  })

  test('should throw error when create a presigned post', async () => {
    const error = new Error('Test')

    mockS3.createPresignedPost.mockImplementation(() => {
      throw error
    })

    try {
      await createPresignedPost({
        Region: 'region',
        BucketName: 'bucket',
        Key: 'key'
      })
      return Promise.reject(new Error('Test failed'))
    } catch (err) {
      expect(err).toBe(error)
    }
    return null
  })
})
