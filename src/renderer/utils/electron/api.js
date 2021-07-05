import store from '@/store'
import Vue from 'vue'
// import axios from 'axios'
import utils from '~/utils/'
// const fatch = require('@/utils/common/axios')
const { ipcRenderer } = require('electron')
const api = require.context('~/api/', false, /\.js$/)
const apiObject = {}
const temp = {}
api.keys().forEach(key => {
	temp[key] = {}
	for (const item in api(key)) {
		temp[key][item] = function(param) {
			const url = api(key)[item]
			// let axiosCancel = null
			const id = utils.randomId()
			return {
				abort: () => {
					// if (axiosCancel) axiosCancel()
					ipcRenderer.removeAllListeners(url + '-reply-' + id)
				},
				get: (payload) => {
					const oldParams = payload || param || {}
					// 用于兼容以前的入参，data是提交到接口的，别的参数是配置用
					const params = Object.assign({}, oldParams.data ? oldParams.data : oldParams)
					// 自定义错误处理true为自定义，false全局统一处理，主要是弹窗
					const custError = oldParams.custError === undefined || oldParams.custError === null ? false : oldParams.custError
					return new Promise(async(resolve, reject) => {
						if (!store.state.Setting.online) {
							if (!custError) Vue.prototype.$message.error(window.i18n.t('common.netErrorTip[0]'))
							reject({ code: 899999, message: window.i18n.t('common.netErrorTip[0]') })
						} else {
							/* const CancelToken = axios.CancelToken
							if (!params.timestamp) {
								const serverTime = await fatch.post(`/api/thirdpart/goapi/getServerTime`)
								params.timestamp = serverTime.data.timestamp
							}
							fatch.post(`/api${url}`, { params, cancelToken: new CancelToken(function executor(c) {
									axiosCancel = c
								}) }).then(data => {
								if (data.code === 0) {
									resolve(data)
								} else {
									if (custError) {
										reject(data)
									} else {
										if (data.code === 604) {
											Vue.prototype.$utils.fun.openUpdateWin(data)
										} else if (data.code === 506001 || data.code === 506) {
											data.message = '登录信息失效，请重新登录'
											var timer = setTimeout(() => {
												clearTimeout(timer)
												ipcRenderer.send('logout', {})
												store.dispatch('User/set_accountInfo', { token: '', p: '' })
												window.location.href = window.__winURL + '#/login?resize=true'
											}, 3000)
										}
										if (!data.message && data.code === undefined) {
											console.error(`API@${url}#error:${JSON.stringify(data)}`) // 用于日志记录
											data = { code: 899999, message: '网络异常，请检查网络' }
										} else {
											console.warn(`API@${url}#error:${JSON.stringify(data)}`) // 用于开发工具查看
										}
										if (!custError) Vue.prototype.$message.error(data.message || '网络异常，请检查网络')
										reject(data)
									}
								}
							}).catch(e => {
								resolve(e)
							})*/
							if (url !== '/thirdpart/goapi/getServerTime' && !params.timestamp) {
								try {
									const serverTime = await apiObject.thirdpart.getServerTime().get({ custError: true })
									params.timestamp = serverTime.data.timestamp
								} catch (e) {
									params.timestamp = new Date().getTime()
								}
							}
							try {
								ipcRenderer.send('API', { url, id, params })
								ipcRenderer.once(url + '-reply-' + id, function replay(event, data) {
									if (data.code === 0) {
										resolve(data)
									} else {
										if (custError) {
											if (data.code === 604) Vue.prototype.$utils.fun.openUpdateWin(data)
											reject(data)
										} else {
											if (data.code === 604) {
												Vue.prototype.$utils.fun.openUpdateWin(data)
											} else if (data.code === 506001 || data.code === 506) {
												data.message = window.i18n.t('common.loginInfoExpired')
												Vue.prototype.$message.error(`${data.message}`)
												store.dispatch('Setting/set_pageLoading', { content: window.i18n.t('common.exiting') + '...', translucent: true })
												var timer = setTimeout(async() => {
													clearTimeout(timer)
													await Vue.prototype.$utils.fun.logout()
													store.commit('initState')
													window.location.href = window.__winURL + '#/login?resize=true'
													store.dispatch('Setting/set_pageLoading', '')
												}, 3000)
											} else {
												if (!data.message && data.code === undefined) {
													console.error(`API@${url}#error:${JSON.stringify(data)}`) // 用于日志记录
													data = { code: 899999, message: window.i18n.t('common.netErrorTip[0]') }
												} else {
													console.warn(`API@${url}#error:${JSON.stringify(data)}`) // 用于开发工具查看
												}
												Vue.prototype.$message.error(data.code === 1001001 ? `[code:${data.code}]` + window.i18n.t('common.netErrorTip[0]') : data.message)
												if (!custError) Vue.prototype.$message.error(data.message || window.i18n.t('common.netErrorTip[0]'))
											}
											reject(data)
										}
									}
								})
							} catch (e) {
								reject(e)
							}
						}
					})
				}
			}
		}
	}
	apiObject[key.replace(/(\.\/|\.js)/g, '')] = temp[key]
})
module.exports = apiObject
