// .eslintrc.js – configure ESLint to resolve the '@/*' alias used in the project
module.exports = {
  env: { node: true, es2022: true },
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: process.cwd(),
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  settings: {
    // Tell eslint-plugin-import to use TypeScript resolver which reads tsconfig paths
    'import/resolver': {
      typescript: {
        // Path to the tsconfig that defines the alias '@/*' → './src/*'
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    'import/no-unresolved': 'error',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': ['warn', { extensions: ['.tsx'] }],
  },
  // Ignore generated files and node_modules
  ignorePatterns: ['node_modules/', 'dist/', 'build/'],
};
