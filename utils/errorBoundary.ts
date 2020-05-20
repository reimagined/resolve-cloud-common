export function errorBoundary(errors: Array<Error>): (error: Error) => void {
  return function onError(error: Error): void {
    errors.push(error)
  }
}
