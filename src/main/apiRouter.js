import { ipcMain, dialog } from 'electron'
import utils from '../utils'
const api = require.context('../api/', false, /\.js$/)
// const qs = require('querystringify')

export default App => () => {
	ipcMain.on('API', async(event, arg) => {
		const url = arg.url.toLowerCase()
		const id = arg.id
		// const time = new Date()
		let token = ''
		// let sign
		arg.params = arg.params || {}
		arg.params.appKey = process.env.webConfig.proxy_app_key
		if ((url === '/user/userauth/login' && arg.params.password) || (url === '/user/userauth/register' && arg.params.password) || (url === '/user/userauth/forgetpwd' && arg.params.newPassword) || (url === '/user/userauth/changepwd' && arg.params.oldPassword && arg.params.newPassword && arg.params.newPasswordConfirm)) {
			if (arg.params.password) arg.params.password = utils.md5(arg.params.password + process.env.webConfig.pstring)
			if (arg.params.confirmPassword) arg.params.confirmPassword = utils.md5(arg.params.confirmPassword + process.env.webConfig.pstring)
			if (arg.params.newPassword) arg.params.newPassword = utils.md5(arg.params.newPassword + process.env.webConfig.pstring)
			if (arg.params.oldPassword) arg.params.oldPassword = utils.md5(arg.params.oldPassword + process.env.webConfig.pstring)
			if (arg.params.newPasswordConfirm) arg.params.newPasswordConfirm = utils.md5(arg.params.newPasswordConfirm + process.env.webConfig.pstring)
		}
		/* if (url === '/user/userauth/getloginqrcode') {
			arg.params.app_key = process.env.webConfig.APPKEY
			const tempOldUuid = arg.params.oldUuid ? `&oldUuid=${arg.params.oldUuid}` : ''
			sign = `appSecret=${process.env.webConfig.APPSECRET}&app_key=${arg.params.app_key}${tempOldUuid}&timestamp=${arg.params.timestamp}`
			arg.params.sign = utils.md5(sign).toUpperCase()
		}
		if (url === '/user/userauth/pollingqrcodelogin') {
			arg.params.app_key = process.env.webConfig.APPKEY
			sign = `appSecret=${process.env.webConfig.APPSECRET}&app_key=${arg.params.app_key}&timestamp=${arg.params.timestamp}&uuid=${arg.params.uuid}`
			arg.params.sign = utils.md5(sign).toUpperCase()
		}*/
		let data
		let organId = arg.params.organId || ''
		try {
			if (App.sqliteDb && App.sqliteDb.userDb) {
				if (!App.accountInfo) {
					await App.getAccountInfo()
				}
				token = App.accountInfo.token || ''
				organId = organId || App.accountInfo.organId && App.accountInfo.organId != 0 ? App.accountInfo.organId : ''
				if (url === '/user/userauth/login' && arg.params.autoLogin) {
					arg.params.password = App.accountInfo.p
					token = ''
					organId = '' // 登录不用传企业代码。
				}
			}
			if (url !== '/thirdpart/goapi/getservertime') {
				arg.params.randomId = arg.params.timestamp + utils.randomId() // 随机码，避免签名相同
				arg.params.sign = utils.apiSign(arg.params)
			}
			data = await App.axios.post(arg.url, {
				params: arg.params,
				token,
				lang: App.locale || '',
				organId
			})
			if (data.code === 0 && (url === '/user/userauth/login' || url === '/user/userauth/register')) { // 如果登录成功，把用户加密后的密码回传
				data.data.p = arg.params.password
			}
		} catch (e) {
			data = {
				code: 899999,
				message: App.i18n.__('common.netErrorTip')[0]
			}
			console.error(`rendererError---API@${url}#response:`, e.toString())
		}
		event.sender.send(arg.url + '-reply-' + id, data)
	})
	const apiObject = {}
	api.keys().forEach(key => {
		// var temp = {}
		for (const item in api(key)) {
			const url = api(key)[item]
			api(key)[item] = function(params) {
				return new Promise(async(resolve, reject) => {
					var data, token, organId
					params = params || {}
					params.appKey = process.env.webConfig.proxy_app_key
					const custError = params.custError === undefined || params.custError === null ? false : params.custError
					try {
						if (App.sqliteDb && App.sqliteDb.userDb) {
							if (!App.accountInfo) {
								await App.getAccountInfo()
							}
							console.log('App.accountInfo::::', App.accountInfo)
							if (App.accountInfo.token) token = App.accountInfo.token
							if (App.accountInfo.organId) organId = App.accountInfo.organId
						}
						// 排除thirdpart.getServerTime()接口，避免陷入死循环调用
						/* if (!params.timestamp && key !== 'thirdpart' && item !== 'getServerTime') {
							const serverTime = await apiObject.thirdpart.getServerTime()
							params.timestamp = serverTime.data.timestamp
						}*/
						if (key !== 'thirdpart' && item !== 'getServerTime') {
							const serverTime = await apiObject.thirdpart.getServerTime()
							params.timestamp = serverTime.data.timestamp
							params.randomId = utils.randomId() // 随机码，避免签名相同
							params.sign = utils.apiSign(params)
						}
						// if (key !== 'thirdpart' && item !== 'getServerTime') params.sign = utils.apiSign(params)
						data = await App.axios.post(url, {
							params,
							token,
							lang: App.locale || '',
							organId
						})
					} catch (e) {
						data = e
					}
					if (data.code === 0) {
						resolve(data)
					} else {
						if (custError) {
							reject(data)
						} else {
							if (data.code === 506001 || data.code === 506) {
								data.message = App.i18n.__('common.loginInfoExpired')
								App.isLogout = true
								dialog.showErrorBox(App.i18n.__('common.error'), data.message)
								if (App.$mainWin.webContents) App.$mainWin.webContents.send('gotoLogin')
							} else if (data.code === 604) {
								App.updateApp.openUpdateWin(data)
							}
							if (data.code === undefined) { // 用于主进程日志记录
								console.error(`MainError---API@${url}#response:`, data.toString())
								data = {
									message: App.i18n.__('common.netErrorTip')[0]
								}
								dialog.showErrorBox(App.i18n.__('common.error'), data.message)
							}
							// if (App.$mainWin.webContents) App.$mainWin.webContents.send('gotoLogin')
							resolve(data)
						}
					}
				})
			}
		}
		apiObject[key.replace(/(\.\/|\.js)/g, '')] = api(key)
	})
	return apiObject
}
