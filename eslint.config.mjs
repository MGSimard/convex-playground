// @ts-check

import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";
import globals from "globals";

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

// TanStack ecosystem
import pluginQuery from "@tanstack/eslint-plugin-query";
import pluginRouter from "@tanstack/eslint-plugin-router";
// @ts-expect-error - tanstackConfig is not typed yet
import { tanstackConfig } from "@tanstack/eslint-config";

export default defineConfig([
  // Global configuration
  globalIgnores(["dist"]),

  // TanStack ecosystem configurations (load first)
  tanstackConfig,
  pluginQuery.configs["flat/recommended"],
  pluginRouter.configs["flat/recommended"],

  // Base configurations
  eslint.configs.recommended,

  // TypeScript configurations (type-checked configs right after base)
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  // React ecosystem configurations
  reactX.configs["recommended-typescript"],
  reactDom.configs.recommended,

  // Main configuration with language options and custom rules
  {
    plugins: {
      "react-hooks": reactHooks,
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: { react: { version: "detect" } },
    rules: {
      // React hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/react-in-jsx-scope": "off",
      "react-x/no-context-provider": "off", // Avoid warns from third-party components
      "react-x/no-unstable-context-value": "off", // React Compiler makes this redundant

      // TypeScript-specific rule overrides
      "@typescript-eslint/array-type": ["error", { default: "array" }],
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
    },
  },

  // Prettier integration (should be last to override conflicting rules)
  eslintConfigPrettier,
]);
