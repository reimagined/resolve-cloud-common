import { EOL } from 'os'

export function maybeThrowErrors(errors: Array<Error>, code?: number): void {
  if (Array.isArray(errors) && errors.length > 0) {
    const error: Error & { code?: number } = new Error()
    if (code != null) {
      error.code = code
    }
    error.message = errors.map(({ message }) => message).join(EOL)
    error.stack = errors.map(({ stack }) => stack).join(EOL)
    throw error
  }
}
