import { ipcMain } from 'electron'
import hermes from '~/c-shared/hermes/'
export default App => () => {
	// const hermes = require('../c-shared/hermes/').default
	const waiting = time => {
		return new Promise(resolve => {
			setTimeout(() => resolve(), time)
		})
	}
	const getDataState = async(key, type, params, time) => {
		return new Promise((resolve, reject) => {
			if (App.isLogout) return resolve({ code: 800506, data: {}})
			if (typeof key === 'string') {
				const d = hermes.cAsync(key, true)
				// if (type === 'cReadRealBase64Async') console.log(type, '::::', d, ',', time)
				if (d) {
					return resolve({ code: 0, data: d, key })
				} else {
					if ((new Date().getTime() - time) / 60000 > 2) { // 超时
						return resolve({ code: 800500 })
					} else {
						if (!App.isLogout) {
							return resolve({ code: 1 })
						} else {
							return resolve({ code: 800506, data: {}})
						}
					}
				}
			} else {
				if (!App.isLogout) {
					return resolve({ code: 1 })
				} else {
					return resolve({ code: 800506, data: {}})
				}
			}
		}).then(async res => {
			if (res.code === 1) {
				await waiting(0)
				return getDataState(key, type, params, time)
			} else if (res.code === 0) {
				if (typeof res.data === 'object') res.data.key = key
				return Promise.resolve(res.data)
			} else if (res.code === 800506) {
				return Promise.reject(800506)
			} else {
				return Promise.reject(800500)
			}
		})
	}
	ipcMain.on('chatSdk', async(event, arg) => {
		const { type, param, id } = arg
		let data = { code: 5000, message: 'sdk连接错误' }
		try {
			switch (type) {
				case 'initChat':
					// data = hermes.cHostsAsync(App.api_url_config.im_socket_url)
					// data = await getDataState(data, type, param, new Date().getTime())
					hermes.cToken(App.accountInfo.userId, global.deviceId, App.accountInfo.token, '')
					App.isLogout = false
					App.isTokenOff = false
					data = {
						code: 0
					}
					break
				default:
					if (type === 'cTokenOff') App.isTokenOff = true
					if (type === 'cToken') App.isTokenOff = false
					if (App.isLogout) {
						data = { code: 800506, type, message: '登录失败，请重新登录' }
						break
					}
					if (type.indexOf('Async') > -1) {
						const key = hermes[type](...param)
						data = type === 'cDownloadAsync' ? key : await getDataState(key, type, param, new Date().getTime())
					} else {
						if (param.length) {
							data = hermes[type](...param)
						} else {
							data = hermes[type]()
						}
					}
			}
			event.sender.send('chatSdk-' + type + '-reply-' + id, data)
		} catch (e) {
			try {
				const error = { code: 899999 }
				if (e === 800506) error.code = 800506
				event.sender.send('chatSdk-' + type + '-reply-' + id, error)
				console.error('chatSdk@' + type + ':', e ? e.toString() : e)
			} catch (err) {
				// console.error('chatSdk-event@', err)
			}
		}
	})
	const newHermes = {}
	for (const type in hermes) {
		if (type.indexOf('Async') > -1) {
			newHermes[type] = async function() {
				let data = { code: 5000, message: 'sdk连接错误' }
				const param = [...arguments]
				const key = hermes[type](...param)
				data = await getDataState(key, type, param, new Date().getTime())
				return Promise.resolve(data)
			}
		} else {
			newHermes[type] = hermes[type]
		}
	}
	return newHermes
}
