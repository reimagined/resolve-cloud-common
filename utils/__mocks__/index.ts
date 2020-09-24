import { ignoreNotFoundException } from '../ignoreNotFoundException'
import { ignoreAlreadyExistsException } from '../ignoreAlreadyExistsException'

export { ignoreNotFoundException, ignoreAlreadyExistsException }

export const getLog = jest.fn()

getLog.mockReturnValue(getLog)

Object.assign(getLog, {
  debug: getLog,
  info: getLog,
  verbose: getLog,
  error: getLog,
  warn: getLog
})

export const getAccountIdFromLambdaContext = jest.fn().mockReturnValue('accountId')

export const retry = jest.fn((obj: object, fn: Function) => fn)

export const setLogCorrelationId = jest.fn()

export const Options = {
  Defaults: {
    override: jest.fn()
  }
}
