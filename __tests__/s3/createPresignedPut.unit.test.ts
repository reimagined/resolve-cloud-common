import S3 from 'aws-sdk/clients/s3'
import { mocked } from 'ts-jest/utils'

import createPresignedPut from '../../s3/createPresignedPut'

const mockS3 = mocked(S3.prototype.constructor.prototype, true)

describe('createPresignedPost', () => {
  afterEach(() => {
    mockS3.getSignedUrl.mockClear()
  })
  test('should create a presigned put', async () => {
    mockS3.getSignedUrl.mockReturnValue('presigned-url')

    await createPresignedPut({
      Region: 'region',
      BucketName: 'bucket',
      Key: 'key',
    })

    expect(mockS3.getSignedUrl).toHaveBeenCalledWith('putObject', {
      Bucket: 'bucket',
      Key: 'key',
    })
  })

  test('should throw error when create a presigned put', async () => {
    const error = new Error('Test')

    mockS3.getSignedUrl.mockImplementation(() => {
      throw error
    })

    try {
      await createPresignedPut({
        Region: 'region',
        BucketName: 'bucket',
        Key: 'key',
      })
      return Promise.reject(new Error('Test failed'))
    } catch (err) {
      expect(err).toBe(error)
    }
    return null
  })
})
