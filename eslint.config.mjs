import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    }
  },
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/reader/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          "selector": "Literal[value=/\\b(duration-(3|5|7|10)00|transition-all)\\b/]",
          "message": "Enforcement: Heavy animations and 'transition-all' are banned in the reader. Use 'duration-150' and explicit properties."
        },
        {
          "selector": "JSXOpeningElement[name.name='ReaderImage'] JSXAttribute[name.name='page'] ObjectExpression",
          "message": "Enforcement: Do not pass inline objects as props to list items. Pass primitives to maintain React.memo stability."
        }
      ]
    }
  },
  {
    files: ["src/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          "selector": "Literal[value=/\\b(bg|text|border|fill|stroke)-\\[#[a-fA-F0-9]{3,8}\\]/]",
          "message": "Enforcement: Do not use arbitrary colors (e.g. bg-[#...]). Use CSS variables or design system tokens."
        }
      ],
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-check": false,
          "minimumDescriptionLength": 10
        }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-compiler/react-compiler": "off",
      "@next/next/no-img-element": "warn"
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".agents/**",
  ]),
]);

export default eslintConfig;
