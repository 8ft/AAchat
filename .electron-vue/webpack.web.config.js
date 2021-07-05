'use strict'

process.env.BABEL_ENV = 'web'

const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const BabiliWebpackPlugin = require('babili-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpackBaseConfig = require('./webpack.base.config')
const OpenBrowserPlugin = require('open-browser-webpack-plugin')
const config = require('../config')

let webConfig = {
  devtool: '#cheap-module-eval-source-map',
  entry: {
    web: path.join(__dirname, '..', 'src', 'renderer', 'main.js')
  },
  module: {},
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, '..', 'src', 'index.ejs'),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true
      },
      nodeModules: false
    }),
    new webpack.DefinePlugin({
      'process.env.IS_WEB': 'true'
    }),
    new OpenBrowserPlugin({ url: 'http://localhost:' + config.webConfig.DEV_PORT + '/#/login' })
  ],
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '..', 'dist', 'web')
  },
  target: 'web'
}

/**
 * Adjust webConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  webConfig.devtool = ''

  webConfig.plugins.push(
    new BabiliWebpackPlugin(),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, '..', 'static'),
        to: path.join(__dirname, '..', 'dist', 'web', 'static'),
        ignore: ['.*']
      }
    ]),
    new webpack.DefinePlugin({
      'process.env.webConfig': config.webConfig
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
} else {
  webConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env.webConfig': config.webConfig
    })
  )
}

module.exports = merge(webpackBaseConfig, webConfig)
