const { CheckerPlugin } = require('awesome-typescript-loader');
const { resolve } = require('path');

module.exports = {
  mode: 'production',
  resolve: {
    extensions: ['.js', '.ts'],
    alias: {
      'runway': resolve('./src')
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