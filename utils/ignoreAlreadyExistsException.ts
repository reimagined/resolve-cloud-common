import { isAlreadyExistsException } from './isAlreadyExistsException'

export function ignoreAlreadyExistsException(error?: Error & { code: string }): void {
  if (isAlreadyExistsException(error)) {
    return
  }
  throw error
}
