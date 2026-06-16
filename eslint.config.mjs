import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
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
