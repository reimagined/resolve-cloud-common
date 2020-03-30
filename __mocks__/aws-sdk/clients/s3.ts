const S3 = jest.fn()

S3.prototype.upload = jest.fn()
S3.prototype.putBucketLifecycle = jest.fn()
S3.prototype.putBucketCors = jest.fn()
S3.prototype.putBucketAccelerateConfiguration = jest.fn()
S3.prototype.putPublicAccessBlock = jest.fn()
S3.prototype.putPublicAccessBlock = jest.fn()
S3.prototype.constructor.prototype.createPresignedPost = jest.fn()
S3.prototype.constructor.prototype.getSignedUrl = jest.fn()

export default S3
