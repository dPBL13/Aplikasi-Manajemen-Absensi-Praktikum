/** Konfigurasi Jest untuk Expo SDK 58 (JH-08). Alias `@/` mengikuti tsconfig. */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
