import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore common build and dependency directories
  {
    ignores: [
      ".next/**",
      "node_modules/**", 
      ".vercel/**",
      "build/**",
      "dist/**",
      "out/**"
    ]
  },

  // Apply to JavaScript and TypeScript files
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript"
  ),

  // Custom rules
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Disable prop-types since we're using TypeScript
      "react/prop-types": "off",
      
      // React 17+ doesn't require React import for JSX
      "react/react-in-jsx-scope": "off",
      
      // Ensure unescaped entities are caught
      "react/no-unescaped-entities": "error",
      
      // TypeScript specific rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn", 
        { 
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      
      // Next.js specific rules
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "warn",
      
      // General code quality
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error"
    }
  },

  // Specific rules for configuration files
  {
    files: ["*.config.{js,mjs,ts}"],
    rules: {
      "no-console": "off"
    }
  }
];

export default eslintConfig;