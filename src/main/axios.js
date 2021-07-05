import axios from 'axios'
import querystring from 'querystring'
import utils from '~/utils/index'

export default class Axios {
	instance = null
	_App = null
	constructor({ App }) {
		this._App = App
		this.instance = axios.create({
			headers: {
				app_var: process.env.webConfig.VERSION,
				device_type: global.deviceType,
				device_system: global.deviceSystem,
				device_model: global.deviceModel,
				device_id: global.deviceId,
				device_brand: global.deviceBrand,
				client_type: process.env.webConfig.client_type,
				api_version: process.env.webConfig.api_version,
				'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
			},
			timeout: 10000, // 10秒
			validateStatus: function(status) {
				return true
			}
		})
		this.instance.interceptors.request.use(config => {
			config.data = config.data || {}
			config.headers.token = config.data.token || ''
			if (config.data.organId && config.data.organId != 0) config.headers.organ_id = config.data.organId
			config.headers.lang = config.data.lang || ''
			config.data = querystring.stringify(config.data.params)
			if (config.url.toLowerCase().indexOf('http://') === -1 && config.url.toLowerCase().indexOf('https://') === -1) {
				config.url = this._App.api_url_config.api_url + config.url
			}
			if (config.url.indexOf('/health') === -1 && config.url.indexOf('/loopUserOnlineState') === -1 && config.url.indexOf('/getServerTime') === -1) {
				console.log(`${config.method}#headers@${config.url}@token=${config.headers.token}&lang=${config.headers.lang}&organ_id=${config.headers.organ_id || ''}`)
				console.log(`${config.method}@${config.url}?${config.data ? config.data : ''}`)
			}
			return config
		})
		this.instance.interceptors.response.use(response => {
			// global.globalStandardTime = response.headers.date
			return response.data
		})
	}
	async getNetConfig(args) {
		args = args || {}
		let { paramType, count } = args
		if (count === undefined) count = 0
		if (paramType === undefined) paramType = ''
		try {
			const appKey = process.env.webConfig.proxy_app_key
			const serverTime = await this.post(process.env.webConfig.proxy_api_url + '/proxy/time/getServerTime')
			const params = {
				paramType,
				appKey,
				timestamp: serverTime.data.timestamp
			}
			params.sign = utils.apiSign(params)
			const paramsByType = await this.post(process.env.webConfig.proxy_api_url + '/proxy/paramInfo/getParamsByType', { params })
			if (paramsByType.code !== 0) {
				return Promise.reject(paramsByType)
			} else {
				return Promise.resolve(paramsByType)
			}
		} catch (e) {
			if (count < 3) {
				return this.getNetConfig({ paramType, count: ++count })
			} else {
				return Promise.reject(e)
			}
		}
	}
	async post(url, params, count, isGetNetConfig) {
		try {
			if (this._App.isQuit) return Promise.reject()
			if (count === undefined) count = 0
			if (isGetNetConfig === undefined) isGetNetConfig = true
			const data = await this.instance.post(url, params)
			return Promise.resolve(data)
		} catch (e) {
			return Promise.reject(e)
			// 重试次数从2.1开始去掉
			/* if (count < 3) {
				return this.post(url, params, ++count, isGetNetConfig)
			} else {
				if (isGetNetConfig && url !== process.env.webConfig.proxy_api_url + '/proxy/time/getServerTime' && url !== process.env.webConfig.proxy_api_url + '/proxy/paramInfo/getParamsByType') {
					return this.getNetConfig().then(res1 => {
						this._App.setApiUrlConfig(res1)
						return this.post(url, params, 0, false)
					}).catch(err => {
						return Promise.reject(err)
					})
				} else {
					return Promise.reject(e)
				}
			}*/
		}
	}
	async get(url, params, count, isGetNetConfig) {
		try {
			if (this._App.isQuit) return Promise.reject()
			if (count === undefined) count = 0
			if (isGetNetConfig === undefined) isGetNetConfig = true
			const data = await this.instance.get(url, params || {})
			return Promise.resolve(data)
		} catch (e) {
			return Promise.reject(e)
			// 重试次数从2.1开始去掉
			/* if (count < 3) {
				return this.get(url, ++count, isGetNetConfig)
			} else {
				if (isGetNetConfig && url !== process.env.webConfig.proxy_api_url + '/proxy/time/getServerTime' && url !== process.env.webConfig.proxy_api_url + '/proxy/paramInfo/getParamsByType') {
					return this.getNetConfig().then(res1 => {
						this._App.setApiUrlConfig(res1)
						return this.get(url, 0, false)
					}).catch(err => {
						return Promise.reject(err)
					})
				} else {
					return Promise.reject(e)
				}
			}*/
		}
	}
}

/* export default {
	async getNetConfig(count) {
		console.log(33333333)
		try {
			if (count === undefined) count = 0
			const app_key = process.env.webConfig.proxy_app_key
			const appSecret = process.env.webConfig.proxy_appSecret
			const serverTime = await this.post(process.env.webConfig.proxy_api_url + '/proxy/time/getServerTime')
			const params = {
				paramType: '',
				app_key,
				timestamp: serverTime.data.timestamp
			}
			const sign = `appSecret=${appSecret}&app_key=${app_key}&paramType=${params.paramType}&timestamp=${params.timestamp}`
			params.sign = utils.md5(sign).toUpperCase()
			const paramsByType = await this.post(process.env.webConfig.proxy_api_url + '/proxy/paramInfo/getParamsByType', { params })
			return Promise.resolve(paramsByType.data)
		} catch (e) {
			if (count < 3) {
				return this.getNetConfig(++count)
			} else {
				return Promise.reject(e)
			}
		}
	},
	async post(url, params, count) {
		try {
			if (count === undefined) count = 0
			const data = await instance.post(url, params)
			return Promise.resolve(data)
		} catch (e) {
			if (count < 3) {
				return this.post(url, params, ++count)
			} else {
				if (url !== process.env.webConfig.proxy_api_url + '/proxy/time/getServerTime' && url !== process.env.webConfig.proxy_api_url + '/proxy/paramInfo/getParamsByType') {
					return this.getNetConfig().then(res1 => {
						return this.post(url, params, 0)
					}).catch(err => {
						return Promise.reject(err)
					})
				} else {
					return Promise.reject(e)
				}
			}
		}
	},
	async get(url, count) {
		try {
			if (count === undefined) count = 0
			const data = await instance.get(url)
			return Promise.resolve(data)
		} catch (e) {
			if (count < 3) {
				return this.get(url, ++count)
			} else {
				return Promise.reject(e)
			}
		}
	}
}*/
