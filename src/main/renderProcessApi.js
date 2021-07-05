// 暴露node原生方法给渲染进程
const _process = process
const _module = module
const _require = require
const _Buffer = Buffer

process.once('loaded', function() {
	global.process = _process
	global.Buffer = _Buffer
	global.module = _module
	global.require = _require
	global.__dirname = __dirname
})
