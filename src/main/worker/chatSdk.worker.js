const { isMainThread, Worker, parentPort } = require('worker_threads')
const ffi = require('ffi-napi')
const path = require('path')
function isJSONString(str) {
	if (typeof str == 'string') {
		try {
			var obj = JSON.parse(str)
			if (typeof obj == 'object' && obj) {
				return true
			} else {
				return false
			}
		} catch (e) {
			return false
		}
	}
}
function formatData(data) {
	if (isJSONString(data)) {
		return JSON.parse(data)
	} else {
		return data
	}
}
function mainThread(dllPath) {
	return new Promise((resolve, reject) => {
		const worker = new Worker(path.resolve(__filename))
		worker.on('exit', code => {
			console.log(`main: worker stopped with exit code ${code}`)
			resolve({ code: 0 })
		})
		worker.on('message', msg => {
			console.log(`main: receive ${msg}`)
			resolve(formatData(msg))
			worker.terminate()
		})
		worker.on('error', msg => {
			console.log('main:error@', msg)
			resolve({ code: 0 })
			worker.terminate()
		})
		worker.postMessage(dllPath)
	})
}
if (isMainThread) {
	const { app } = require('electron')
	const appPath = process.env.NODE_ENV === 'development' ? app.getAppPath() : path.join(app.getAppPath(), 'dist', 'desktop')
	const dllName = `hermes-${process.env.webConfig.HERMES_VERSION}.${process.platform === 'darwin' ? 'dylib' : 'dll'}`
	const dllPath = path.join(appPath, require('~/c-library/hermes/' + dllName))
	module.exports = (params) => {
		params.dllPath = dllPath
		console.log('chatSdk@', params.type)
		return mainThread(JSON.stringify(params)).then(res => {
			return res
		})
	}
} else {
	parentPort.on('message', payload => {
		payload = JSON.parse(payload)
		const methods = require('../../c-shared/hermes/config').default
		const hermes = ffi.Library(payload.dllPath, methods)
		const data = payload.params.length ? hermes[payload.type](...payload.params) : hermes[payload.type]()
		console.log(123423455, data)
		parentPort.postMessage(data)
	})
}
