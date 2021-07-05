import ffi from 'ffi-napi'
import path from 'path'
import { app } from 'electron'
import methods from './config'
import utils from '~/utils/'
const appPath = process.env.NODE_ENV === 'development' ? app.getAppPath() : path.join(app.getAppPath(), 'dist', 'desktop')
const dllName = `hermes-${process.env.webConfig.HERMES_VERSION}.${process.platform === 'darwin' ? 'dylib' : 'dll'}`
const dllPath = path.join(appPath, require('~/c-library/hermes/' + dllName))
const hermes = ffi.Library(dllPath, methods)
const timeStampToInt = (json) => {
	for (const key in json) {
		if (key === 'time') {
			json.timeStr = json[key].toString()
			json[key] = parseInt(json[key])
		} else if (json[key] instanceof Array) { // 遍历数组
			for (let i = 0; i < json[key].length; i++) {
				timeStampToInt(json[key][i])
			}
		} else if (json[key] instanceof Object) {
			timeStampToInt(json[key])
		}
	}
	return json
}
const formatData = (data, key) => {
	if (utils.isJSONString(data)) {
		/* if (key.indexOf('Async') > -1) {
			const tempJson = JSON.parse(data)
			return timeStampToInt(tempJson)
		} else {
			return JSON.parse(data)
		}*/
		const tempJson = JSON.parse(data)
		return timeStampToInt(tempJson)
	} else {
		return data
	}
}
const apiMap = {}
for (const key in methods) {
	apiMap[key] = function() {
		if (key !== 'cGetAsync' && key !== 'cGetDoneAsync' && key !== 'cAsync' && key !== 'cTime') console.log('chatSdk:', key, ...arguments)
		return formatData(hermes[key](...arguments), key)
	}
}
export default apiMap
