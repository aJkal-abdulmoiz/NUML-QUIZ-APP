import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-plugin-prettier";

export default defineConfig([
  // Global ignores
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**"
  ]),

  // Next.js configs
  ...nextVitals,
  ...nextTs,

  // TypeScript parser
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json"
      }
    }
  },

  // Rules - EXCEPTIONS for any + auto-fix
  {
    rules: {
      // ✅ ALLOW 'any' (your request)
      "@typescript-eslint/no-explicit-any": "off",
      
      // ✅ Auto-fix warnings only
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      
      // ✅ Prettier auto-format
      "prettier/prettier": "error"
    }
  },

  // Prettier integration
  {
    plugins: {
      prettier
    },
    rules: {
      "prettier/prettier": "error"
    }
  }
]);
