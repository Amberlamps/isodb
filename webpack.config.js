const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');

const inProduction = (process.env.NODE_ENV === 'production');

const plugins = !inProduction ? [] : [
  new webpack.optimize.UglifyJsPlugin()
];

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: inProduction ? `${pkg.name}.${pkg.version}.min.js` : `${pkg.name}.js`
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader'
    }]
  },
  plugins
};