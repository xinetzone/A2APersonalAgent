module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/app'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  forceExit: true,
  detectOpenHandles: false,
  testTimeout: 10000
};