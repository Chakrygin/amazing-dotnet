/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 50000,
  openHandlesTimeout: 0,
  setupFiles: [
    '<rootDir>/jest.setup.ts',
  ],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/core/src/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
};
