import S3, { ManagedUpload } from 'aws-sdk/clients/s3'
import { Writable } from 'stream'
import { mocked } from 'ts-jest/utils'

import uploadS3Object from '../../s3/uploadS3Object'

const mockS3 = mocked(S3.prototype, true)

describe('uploadS3Object', () => {
  afterEach(() => {
    mockS3.upload.mockClear()
  })
  test('should upload the S3 object', async () => {
    mockS3.upload.mockReturnValue({
      promise: async () => ({
        Bucket: 'bucket',
        ETag: 'etag',
        Key: 'key',
        Location: 'location',
      }),
    } as ManagedUpload)

    const body = new Writable()

    await uploadS3Object({
      Region: 'region',
      BucketName: 'bucket',
      FileKey: 'key',
      Body: body,
      ContentType: 'content-type',
    })

    expect(mockS3.upload).toHaveBeenCalledWith({
      Bucket: 'bucket',
      Key: 'key',
      Body: body,
      ContentType: 'content-type',
    })
  })

  test('should throw error when upload the S3 object', async () => {
    const error = new Error('Test')

    const body = new Writable()

    mockS3.upload.mockReturnValue({
      promise: async (): Promise<any> => {
        throw error
      },
    } as ManagedUpload)

    try {
      await uploadS3Object({
        Region: 'region',
        BucketName: 'bucket',
        FileKey: 'key',
        Body: body,
        ContentType: 'content-type',
      })
      return Promise.reject(new Error('Test failed'))
    } catch (err) {
      expect(err).toBe(error)
    }
    return null
  })
})
