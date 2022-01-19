export function mergeEnvironmentVariables(
  original: Record<string, string>,
  extending: Record<string, string | null>
): Record<string, string> {
  const result = {
    ...original,
  }

  for (const [key, value] of Object.entries(extending)) {
    if (value == null) {
      delete result[key]
    } else {
      result[key] = value
    }
  }

  return result
}
