module.exports = {
  root: true,
  extends: [
    '@nuxt/eslint-config'
  ],
  rules: {
    // Vue-specific rules
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off',
    
    // TypeScript-specific rules
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn'
  }
}