const HTML = require('html-webpack-plugin');
const { resolve } = require('path');

module.exports = {
  mode: 'development',
  entry: './docs/src/index.js',
  output: {
    path: resolve('./docs/dist'),
    filename: '[name].[hash].js'
  },
  resolve: {
    alias: {
      'runway': resolve('./dist/index.js')
    }
  },
  plugins: [
    new HTML({
      template: 'docs/src/index.html',
      inject: true,
      chunksSortMode: 'dependency'
    })
  ],
  devtool: 'cheap-module-source-map'
}
