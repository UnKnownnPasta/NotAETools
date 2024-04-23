import globals from 'globals'

import path from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import pluginJs from '@eslint/js'
// import stylisticJs from '@stylistic/eslint-plugin-js'

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: pluginJs.configs.recommended
})

export default [
  { languageOptions: { globals: globals.browser } },
  ...compat.extends('standard'),
  {
    files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
    rules: {
      indent: ['error', 4],
      'no-useless-escape': 0,
      'semi': 0,
      'space-before-function-paren': 0
    }
  }
]
