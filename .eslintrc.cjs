module.exports = {
  extends: ['./.eslint-config.cjs'],
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
