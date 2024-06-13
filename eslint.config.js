import eslint from '@eslint/js';
import tslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin'

export default tslint.config(
  eslint.configs.recommended,
  ...tslint.configs.recommendedTypeChecked,
  ...tslint.configs.stylisticTypeChecked,
  {
    files: ['*.config.js'],
    extends: [tslint.configs.disableTypeChecked],
  },
  {
    plugins: {
      '@stylistic': stylistic
    },
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.json',
      },
    },
    rules: {
      // ESLint Stylistic
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'always'],
    }
  }
);
