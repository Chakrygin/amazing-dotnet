module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.eslint.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',
  ],
  rules: {
    /* https://typescript-eslint.io/rules/ */

    /* ================ */
    /* TypeScript Rules */
    /* ================ */

    /* TODO... */

    /* =============== */
    /* Extension Rules */
    /* =============== */

    /* TODO... */

    /* ================ */
    /* Formatting Rules */
    /* ================ */

    'block-spacing': 'off',
    '@typescript-eslint/block-spacing': 'error',

    'brace-style': 'off',
    '@typescript-eslint/brace-style': ['error', 'stroustrup'],

    'comma-dangle': 'off',
    '@typescript-eslint/comma-dangle': ['error', 'always-multiline'],

    'comma-spacing': 'off',
    '@typescript-eslint/comma-spacing': 'error',

    'func-call-spacing': 'off',
    '@typescript-eslint/func-call-spacing': 'error',

    'indent': 'off',
    '@typescript-eslint/indent': ['error', 2],

    'key-spacing': 'off',
    '@typescript-eslint/key-spacing': 'error',

    // "keyword-spacing": "off",
    // "@typescript-eslint/keyword-spacing": "error",

    'lines-between-class-members': 'off',
    '@typescript-eslint/lines-between-class-members': ['error', 'always', {
      'exceptAfterSingleLine': true,
    }],

    '@typescript-eslint/member-delimiter-style': 'error',

    'no-extra-parens': 'off',
    '@typescript-eslint/no-extra-parens': 'error',

    'object-curly-spacing': 'off',
    '@typescript-eslint/object-curly-spacing': ['error', 'always'],

    // 'padding-line-between-statements': 'off',
    // '@typescript-eslint/padding-line-between-statements': 'error',

    'quotes': 'off',
    '@typescript-eslint/quotes': ['error', 'single'],

    'semi': 'off',
    '@typescript-eslint/semi': 'error',

    'space-before-blocks': 'off',
    '@typescript-eslint/space-before-blocks': 'error',

    'space-before-function-paren': 'off',
    '@typescript-eslint/space-before-function-paren': ['error', {
      'anonymous': 'always',
      'named': 'never',
      'asyncArrow': 'always',
    }],

    'space-infix-ops': 'off',
    '@typescript-eslint/space-infix-ops': 'error',

    '@typescript-eslint/type-annotation-spacing': 'error',
  },
};
