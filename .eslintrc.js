module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    "@next/next/no-img-element": "off",
    "@next/next/no-assign-module-variable": "off",
    "react/no-unescaped-entities": "off",
    "react-hooks/exhaustive-deps": "warn",
  },
};