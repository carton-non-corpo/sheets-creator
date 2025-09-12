// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt([
  {
    ignores: [
      'app/components/ui/**/*',
      'app/types/codegen/*',
      'hasura/**/*',
      'python/**/*',
    ],
  },
  {
    rules: {
    // Stylistic rules
      'semi': ['error', 'always'],
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'comma-dangle': ['error', 'always-multiline'],
      'arrow-parens': ['error', 'as-needed'],
      'brace-style': ['error', '1tbs'],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],

      // Vue-specific rules
      'vue/html-indent': ['error', 2],
      'vue/html-quotes': ['error', 'double'],
      'vue/max-attributes-per-line': ['error', {
        'singleline': 3,
        'multiline': 1,
      }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/html-closing-bracket-newline': ['error', {
        'singleline': 'never',
        'multiline': 'always',
      }],
      'vue/html-self-closing': ['error', {
        'html': {
          'void': 'always',
          'normal': 'never',
          'component': 'always',
        },
      }],
    },
  },
]);
