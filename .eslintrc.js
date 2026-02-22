module.exports = {
  env: {
    node:   true,
    es2021: true,
    jest:   true,
  },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest' },
  rules: {
    'no-console':     'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-process-exit':'off',
    'prefer-const':   'error',
    'no-var':         'error',
    'eqeqeq':        ['error', 'always'],
    'curly':         'error',
  },
};
