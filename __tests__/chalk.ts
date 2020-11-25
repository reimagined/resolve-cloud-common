const chalk = (str: string): string => str

export default {
  red: { inverse: chalk },
  yellow: { inverse: chalk },
  white: chalk,
  green: chalk
}
