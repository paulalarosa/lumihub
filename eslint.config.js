import storybook from "eslint-plugin-storybook";
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  {
    ignores: ["dist", "dev-dist", "storybook-static", "public", "node_modules", "supabase/functions", "my-app"]
  },
  ...(storybook.configs?.["flat/recommended"] ? [storybook.configs["flat/recommended"]].flat() : []),
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}", "tailwind.config.ts"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
      "unused-imports": unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "no-empty": "warn",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/media-has-caption": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/heading-has-content": "off",
      "jsx-a11y/anchor-has-content": "off",
      "jsx-a11y/img-redundant-alt": "off",
      "storybook/no-renderer-packages": "off"
    },
  }
);