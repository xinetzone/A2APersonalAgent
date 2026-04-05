module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/app'],
  testMatch: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!app/**/*.d.ts',
    '!src/**/*.test.ts',
    '!app/**/*.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  forceExit: true,
  detectOpenHandles: false,
  testTimeout: 10000,
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ]
};