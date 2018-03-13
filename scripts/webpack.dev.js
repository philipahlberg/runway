const { CheckerPlugin } = require('awesome-typescript-loader');
const { resolve } = require('path');

module.exports = {
  mode: 'development',
  resolve: {
    extensions: ['.js', '.ts'],
    alias: {
      'runway': resolve('./src/index.ts')
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