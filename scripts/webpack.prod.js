const { CheckerPlugin } = require('awesome-typescript-loader');
const { resolve } = require('path');

module.exports = {
  mode: 'production',
  resolve: {
    alias: {
      'runway': resolve('./dist/index.js')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader'
      }
    ]
  },
  plugins: [
    new CheckerPlugin()
  ],
  devtool: 'inline-source-map'
}