module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2018,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "off",
    "quotes": "off",
    "linebreak-style": "off",
    "max-len": "off",
    "object-curly-spacing": "off",
    "comma-dangle": "off",
    "indent": "off",
    "space-before-function-paren": "off",
    "no-trailing-spaces": "off",
    "no-unused-vars": "warn",
    "quote-props": "off",
    "one-var": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.*", "**/*.test.*", "**/test/**/*.js"],
      env: {
        mocha: true,
      },
      rules: {
        "no-undef": "off",
      },
    },
  ],
  globals: {},
};
