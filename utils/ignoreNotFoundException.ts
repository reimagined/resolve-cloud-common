import { isNotFoundException } from './isNotFoundException'

export function ignoreNotFoundException(error?: Error & { code: string }): void {
  if (isNotFoundException(error)) {
    return
  }
  throw error
}
