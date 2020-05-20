export function validateRequiredFields<T, M extends { [key: string]: string | void }>(
  errors: Array<Error>,
  requiredFields: M,
  callback: (arg: { [key in keyof M]: string }) => T
): T | void {
  const validatedFields: any = {}
  let isFailed = false
  for (const key of Object.keys(requiredFields)) {
    if (requiredFields[key] != null) {
      validatedFields[key] = requiredFields[key]
    } else {
      isFailed = true
      errors.push(new Error(`The variable "${key}" is required`))
    }
  }
  if (isFailed) {
    return undefined
  }
  return callback(validatedFields)
}
