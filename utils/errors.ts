export class HttpError extends Error {
  code: number

  constructor(message: string, code: number) {
    super(message)
    this.code = code
  }
}

export class NotFoundError extends Error {
  code: string

  constructor(
    message: string,
    code:
      | 'ResourceNotFoundException'
      | 'NoSuchEntity'
      | 'NotFoundException'
      | 'StateMachineDoesNotExist'
      | 'NoSuchDistribution'
      | 'NoSuchCloudFrontOriginAccessIdentity'
  ) {
    super(message)
    this.code = code
  }
}
