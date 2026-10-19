// ESLint 10 flat config. It replaces .eslintrc.json: the rules and the folder-by-folder overrides are the same.
// None of the enabled rules need type information, so there is no parserOptions.project (linting is about twice as fast).
// If a type-aware rule is turned on later, add languageOptions.parserOptions.projectService to the TypeScript block.
import {defineConfig} from 'eslint/config';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {ignores: ['projects/**/*']},

  // All TypeScript files. Inline templates are linted with the template rules below.
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended, angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@angular-eslint/no-empty-lifecycle-method': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/explicit-member-accessibility': ['off', {accessibility: 'explicit'}],
      'id-blacklist': 'off',
      'id-match': 'off',
      'no-underscore-dangle': 'off',
      '@typescript-eslint/member-ordering': 'off',
      'max-len': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      radix: 'off',
      eqeqeq: ['warn', 'always', {null: 'ignore'}],
      '@typescript-eslint/no-use-before-define': 'off',
      'guard-for-in': 'off',
      '@angular-eslint/component-selector': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-console': ['warn', {allow: ['warn', 'error']}],
      'brace-style': 'off',
      curly: 'off',
      'arrow-body-style': 'off',
      '@angular-eslint/use-lifecycle-interface': 'off',
      '@angular-eslint/no-output-native': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@angular-eslint/no-output-rename': 'off',
      '@angular-eslint/contextual-lifecycle': 'off',
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/prefer-standalone': 'warn',
      '@angular-eslint/prefer-inject': 'warn',
      '@angular-eslint/prefer-signals': 'warn',
      '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
      '@angular-eslint/prefer-host-metadata-property': 'warn',
    },
  },

  // All templates.
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended],
    rules: {
      '@angular-eslint/template/eqeqeq': 'off',
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-ngsrc': 'warn',
      '@angular-eslint/template/prefer-class-binding': 'warn',
      '@angular-eslint/template/no-inline-styles': 'warn',
    },
  },

  // The shell and the redesign are held to error, so new code there cannot add warnings.
  {
    files: [
      'src/main.ts',
      'src/app/app.component.ts',
      'src/app/app.module.ts',
      'src/app/app.routing.ts',
      'src/app/pages/scholarly-commons/**/*.ts',
      'src/app/shared/scholarly-commons/**/*.ts',
      'src/app/shared/forbidden-page/*.ts',
      'src/app/shared/not-found-page/*.ts',
      'src/app/services/authentication.service.ts',
      'src/app/services/authentication-interceptor.ts',
      'src/app/services/auth.guard.ts',
      'src/app/services/resource.service.ts',
      'src/app/services/tracking.service.ts',
      'src/app/services/sentry-init.ts',
    ],
    rules: {
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/prefer-inject': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-host-metadata-property': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      eqeqeq: 'error',
      'no-console': ['error', {allow: ['warn', 'error']}],
    },
  },

  {
    files: [
      'src/app/app.component.html',
      'src/app/pages/scholarly-commons/**/*.html',
      'src/app/shared/scholarly-commons/**/*.html',
      'src/app/shared/forbidden-page/*.html',
      'src/app/shared/not-found-page/*.html',
    ],
    rules: {
      '@angular-eslint/template/prefer-ngsrc': 'error',
      '@angular-eslint/template/prefer-class-binding': 'error',
      '@angular-eslint/template/no-inline-styles': 'error',
    },
  },

  // The legacy Catalogue UI is excluded from these rules.
  {
    files: [
      'src/catalogue-ui/**/*.ts',
      'src/catalogue-ui/**/*.html',
    ],
    rules: {
      '@angular-eslint/prefer-standalone': 'off',
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/prefer-signals': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      '@angular-eslint/prefer-host-metadata-property': 'off',
      '@angular-eslint/template/prefer-ngsrc': 'off',
      '@angular-eslint/template/prefer-class-binding': 'off',
      '@angular-eslint/template/no-inline-styles': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      eqeqeq: 'off',
      'no-console': 'off',
    },
  },
]);
