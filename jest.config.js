process.env.TZ = 'Europe/Moscow'

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.unit.test.[jt]s?(x)'],
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  roots: ['<rootDir>'],
}
