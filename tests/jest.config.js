module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../',  // Go up one level since config is now in tests/
  roots: ['<rootDir>/tests'],
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,js}',
    '<rootDir>/tests/**/*.spec.{ts,js}'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverageFrom: [
    'services/**/*.{ts,js}',
    'app/**/*.{ts,tsx}',
    '!services/**/*.d.ts',
    '!services/**/index.ts',
    '!**/*.config.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 10000,
};