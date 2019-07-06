module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended'],
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    // disable rules from @typescript-eslint/recommended:
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/prefer-interface': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    'no-useless-constructor': 'off',
    '@typescript-eslint/explicit-function-return-type': ['error', { allowTypedFunctionExpressions:true, allowExpressions: true }]
  }
};

