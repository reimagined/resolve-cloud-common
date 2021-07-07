process.env.TZ = 'Europe/Moscow'

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.functional.test.[jt]s?(x)'],
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  roots: ['<rootDir>'],
  modulePathIgnorePatterns: ['<rootDir>/src/.*/__mocks__', '<rootDir>/__mocks__'],
}
