module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup:    './src/tests/setup.js',
  globalTeardown: './src/tests/teardown.js',
  // CORRECTION C1: was setupFilesAfterFramework (typo) — correct key is setupFilesAfterEnv
  setupFilesAfterEnv: ['./src/tests/helpers/db.helper.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js', '!src/tests/**', '!src/docs/**'],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80, statements: 80 },
  },
  testTimeout: 15000,
  // CORRECTION C9: OpenAI mock at project root (auto-discovered by Jest)
  moduleNameMapper: {
    '^openai$': '<rootDir>/__mocks__/openai.js',
  },
};
