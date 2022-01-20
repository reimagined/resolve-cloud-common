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

export const retry = jest.fn((obj: Record<string, any>, fn: () => any) => fn)

export const setLogCorrelationId = jest.fn()

export const Options = {
  Defaults: {
    override: jest.fn()
  }
}

export const mergeEnvironmentVariables = (
  first: Record<string, string>,
  second: Record<string, string | null>
) => ({
  ...first,
  ...second
})
