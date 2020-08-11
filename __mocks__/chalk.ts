export interface Chalk {
  white: any
  yellow: any
  green: any
  red: any
}

const chalk: Chalk = {
  white: jest.fn(),
  yellow: {
    inverse: jest.fn(),
  },
  green: jest.fn(),
  red: {
    inverse: jest.fn(),
  },
}

export default chalk
