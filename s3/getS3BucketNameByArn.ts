const getS3BucketNameByArn = (BucketArn: string): string => {
  const strings = BucketArn.split(':')
  if (strings.length !== 6 || strings[5] == null || strings[5] === '') {
    throw new Error('Invalid Bucket Arn')
  }
  const BucketName = strings[5]

  return BucketName
}

export default getS3BucketNameByArn
