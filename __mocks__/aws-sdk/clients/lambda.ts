const Lambda = jest.fn()

Lambda.prototype.deleteFunctionConcurrency = jest.fn()
Lambda.prototype.putFunctionConcurrency = jest.fn()
Lambda.prototype.invoke = jest.fn()
Lambda.prototype.getFunctionConfiguration = jest.fn()
Lambda.prototype.updateFunctionConfiguration = jest.fn()
Lambda.prototype.updateFunctionCode = jest.fn()
Lambda.prototype.createFunction = jest.fn()
Lambda.prototype.listTags = jest.fn()
Lambda.prototype.tagResource = jest.fn()
Lambda.prototype.untagResource = jest.fn()
Lambda.prototype.putFunctionEventInvokeConfig = jest.fn()
Lambda.prototype.waitFor = jest.fn().mockReturnValue({
  promise: () => {}
})

export default Lambda
