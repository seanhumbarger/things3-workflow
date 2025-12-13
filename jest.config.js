module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: [
    '<rootDir>/tests/services/jest.setup.js'
  ],
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/tests/__mocks__/obsidian.ts',
    '^sql.js$': '<rootDir>/tests/__mocks__/sql.js.ts',
    '\\.(wasm|node|bin)$': '<rootDir>/tests/__mocks__/empty.js',
    '^source-map-support$': '<rootDir>/tests/__mocks__/empty.js',
    '^source-map-support(.*)$': '<rootDir>/tests/__mocks__/empty.js',
  },
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/'
  ],
};
