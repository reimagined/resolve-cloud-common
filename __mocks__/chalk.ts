export interface Chalk {
  white: any
  yellow: any
  green: any
  red: any
}

const fn = (str: string): string => str

const chalk: Chalk = {
  white: fn,
  yellow: {
    inverse: fn
  },
  green: fn,
  red: {
    inverse: fn
  }
}

export default chalk
