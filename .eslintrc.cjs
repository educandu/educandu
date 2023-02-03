module.exports = {
  extends: ['@educandu/eslint-config'],
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
