const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  {
    ignores: ['coverage/**', 'node_modules/**', 'test/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2017,
      sourceType: 'commonjs',
      globals: globals.node
    },
    rules: {
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
      indent: ['error', 2, { SwitchCase: 1 }]
    }
  }
]
