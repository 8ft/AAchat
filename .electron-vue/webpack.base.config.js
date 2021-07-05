const utils = require('./utils')
const webpack = require('webpack')
const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const BabiliWebpackPlugin = require('babili-webpack-plugin')
const isProduction = process.env.NODE_ENV === 'production'
const styleLoaders= utils.styleLoaders()
const packageConfig = require('../package.json')
const config = require('../config')
let whiteListedModules = ['vue', 'ant-design-vue']
const baseConfig = {
	externals: [
		...Object.keys(packageConfig.dependencies || {}).filter(d => !whiteListedModules.includes(d))
	],
  module: {
    rules: styleLoaders.concat([
	    {
		    test: /\.(js|vue)$/,
		    loader: 'eslint-loader',
		    enforce: "pre",
		    options: {
			    formatter: require('eslint-friendly-formatter')
		    }
	    },
    	{
          test: /\.html$/,
          use: 'vue-html-loader'
        },
        {
          test: /\.js$/,
          use: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /\.node$/,
          use: 'node-loader'
        },
        {
          test: /\.vue$/,
          use: {
            loader: 'vue-loader',
            options: utils.cssLoaders({
              sourceMap: isProduction,
              extract: isProduction
            })
          }
        },
        {
          test: /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/,
          use: {
            loader: 'url-loader',
            query: {
              limit: 1,
              name: 'imgs/[hash:7].[name].[ext]'
            }
          }
        },
        {
          test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
          use: {
            loader: 'url-loader',
            query: {
              limit: 1,
              name: 'fonts/[hash:7].[name].[ext]'
            }
          }
        }])
  },
  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({filename: 'styles.css'}),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ],
  resolve: {
    alias: {
      '@': path.join(__dirname, '..', 'src', 'renderer'),
      '~': path.join(__dirname, '..', 'src'),
      'vue$': 'vue/dist/vue.esm.js',
      'jquery': 'jquery'
    },
    extensions: ['.js', '.vue', '.json', '.css', '.node', '.scss']
  }
}
const definePlugin = {
	'process.env.webConfig': config.webConfig,
	'process.env.appId': process.platform === 'darwin' ? '"com.'+ config.webConfig.PROJECT_NAME.replace(/"/ig, '') + '.desktop"' : '"' + config.webConfig.PROJECT_NAME.replace(/"/ig, '') + '"',
	'process.env.buildTime': '"' + utils.formatDate(new Date(), 'yy-M-d h:m') + '"',
	'process.env.PROJECT_NAME': config.webConfig.PROJECT_NAME,
	'process.env.ENV_CONFIG': config.webConfig.ENV_CONFIG
}

if (process.env.NODE_ENV !== 'production') {
	definePlugin['__static'] = `"${path.join(__dirname, '..', 'static').replace(/\\/g, '\\\\')}"`
}

if (process.env.NODE_ENV === 'production') {
	baseConfig.plugins.push(
		new BabiliWebpackPlugin()
	)
}
baseConfig.plugins.push(
	new webpack.DefinePlugin(definePlugin)
)
module.exports = baseConfig
