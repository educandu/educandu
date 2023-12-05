module.exports = {
  extends: ['./.eslint-config.cjs'],
  rules: {
    'import/no-unresolved': ['error', { ignore: ['^@educandu/*', '^vitest/*', '^p-queue$'] }]
  },
  overrides: [
    {
      files: ['migrations/**/*.js'],
      rules: {
        'camelcase': ['off'],
        'no-console': ['off']
      }
    }
  ]
};
