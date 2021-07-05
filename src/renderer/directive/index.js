module.exports.install = function(Vue) {
	const requireAll = context => context.keys().map(context)
	const directives = require.context('./', true, /\.js$/)
	requireAll(directives).forEach((item) => {
		if (item.default) item.default.install(Vue)
	})
}
