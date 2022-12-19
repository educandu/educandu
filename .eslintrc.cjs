module.exports = {
  extends: ['@educandu/eslint-config'],
  overrides: [
    {
      files: ['migrations/**/*.js'],
      rules: {
        'no-console': ['off']
      }
    }
  ]
};
