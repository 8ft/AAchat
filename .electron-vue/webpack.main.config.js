'use strict'

process.env.BABEL_ENV = 'main'

const path = require('path')
const webpack = require('webpack')
const webpackBaseConfig = require('./webpack.base.config')
const merge = require('webpack-merge')
let mainConfig = {
  entry: {
    main: path.join(__dirname, '..', 'src', 'main', 'index.js')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '..', 'dist', 'desktop')
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin()
  ],
  target: 'electron-main'
}
if (process.platform === 'darwin') {
	mainConfig.module.rules.push({
		test: /\.dylib(\?.*)?$/,
		use: {
			loader: 'file-loader',
			query: {
				name: '[ext]s/[hash:7].[name].[ext]'
			}
		}
	})
} else {
	mainConfig.module.rules.push({
		test: /\.dll(\?.*)?$/,
		use: {
			loader: 'file-loader',
			query: {
				name: '[ext]s/[hash:7].[name].[ext]'
			}
		}
	})
}
module.exports = merge(webpackBaseConfig, mainConfig)
