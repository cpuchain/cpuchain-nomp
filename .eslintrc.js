module.exports = {
  "env": {
    "browser": false,
    "node": true,
    "commonjs": true,
    "es2022": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "indent": [
      "error",
      4
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ],
    "no-unused-vars": "warn"
  }
}
