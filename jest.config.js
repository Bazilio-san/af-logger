module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
  ],
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  testRegex: [
    '.+\\.test\\.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/config/',
    '/_misc/',
    '/_tmp/',
    '/.idea/',
  ],
  globals: { 'ts-jest': { tsconfig: 'tsconfig.json' } },
};
