var path = require('path')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
function resolveResouce(name) {
  return path.resolve(__dirname, '../src/renderer/assets/style/' + name)
}
exports.cssLoaders = function (options) {
  options = options || {}

  var cssLoader = {
    loader: 'css-loader',
    options: {
      minimize: process.env.NODE_ENV === 'production',
      sourceMap: options.sourceMap,
	    sass: {
		    data: `$projectName: "${process.env.PROJECT_NAME}";`
	    }
    }
  }

  // generate loader string to be used with extract text plugin
  function generateLoaders (loader, loaderOptions) {
    var loaders = [cssLoader]
    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap || true
        })
      })
    }
    if (loader === 'sass' || loader === 'scss') {
      loaders.push({
        loader:  'sass-resources-loader',
        options: {
        	resources: [
        		resolveResouce('var.scss'),
		        resolveResouce('mixin.scss'),
	        ],
        }
      })
    }
    // Extract CSS when that option is specified
    // (which is the case during production build)
    if (options.extract) {
      return ExtractTextPlugin.extract({
        use: loaders,
        fallback: 'vue-style-loader'
      })
    } else {
      return ['vue-style-loader'].concat(loaders)
    }
  }

  // https://vue-loader.vuejs.org/en/configurations/extract-css.html
  return {
    css: generateLoaders(),
    postcss: generateLoaders(),
    less: generateLoaders('less'),
    sass: generateLoaders('sass', { indentedSyntax: true }),
    scss: generateLoaders('sass'),
    // 'sass-resources':generateLoaders('sass-resources', { resources: [resolveResouce('var.scss'), resolveResouce('commons.scss')] }),
    stylus: generateLoaders('stylus'),
    styl: generateLoaders('stylus')
  }
}

// Generate loaders for standalone style files (outside of .vue)
exports.styleLoaders = function (options) {
  var output = []
  var loaders = exports.cssLoaders(options)
  for (var extension in loaders) {
    var loader = loaders[extension]
    output.push({
      test: new RegExp('\\.' + extension + '$'),
      use: loader
    })
  }
  return output
}

/* ???????????????*/
// ???Date??????????????? Date ????????????????????????String
// ???(M)??????(d)?????????(h)??????(m)??????(s)?????????(q) ????????? 1-2 ???????????????
// ???(y)????????? 1-4 ?????????????????????(S)????????? 1 ????????????(??? 1-3 ????????????)
// ?????????
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
exports.formatDate = function(nowDate, fmt) { // author: meizz
	fmt = fmt || 'yyyy-MM-dd'
	var o = {
		'M+': nowDate.getMonth() + 1,                 // ??????
		'd+': nowDate.getDate(),                    // ???
		'h+': nowDate.getHours(),                   // ??????
		'm+': nowDate.getMinutes(),                 // ???
		's+': nowDate.getSeconds(),                 // ???
		'q+': Math.floor((nowDate.getMonth() + 3) / 3), // ??????
		'S': nowDate.getMilliseconds()             // ??????
	}
	if (/(y+)/.test(fmt)) { fmt = fmt.replace(RegExp.$1, (nowDate.getFullYear() + '').substr(4 - RegExp.$1.length)) }
	for (var k in o) {
		if (new RegExp('(' + k + ')').test(fmt)) { fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length))) }
	}
	return fmt
}