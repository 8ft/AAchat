import Vue from 'vue'
const { user } = require('@/utils/electron/api')
const sqlite = require('@/utils/electron/sqlite')
const jsencrypt = require('@/utils/common/jsencrypt')
import { isPhone, isCnPhone, isEmail } from '@/utils/web'
import { setAccountInfo } from '@/utils/electron/fun'

const state = {
	list: [],	//	群成员和好友用户详情列表
	accountInfo: { userId: '', nickName: '', userAvatar: '', secretKey: '', accountCode: '', token: '', organId: '', organCode: '', organName: '' },
	lastMessage: {},
	userConfig: {},
	userCard: {
		userId: ''// userCard组件使用的userid
	},
	secretKey: ''
}

const getters = {
	list: (state) => {
		return state.list
	},
	userInfo: (state) => (userId) => {
		return state.list.find(li => {
			return li.userId == userId
		}) || {}
	}
}
const mutations = {
	UPDATE_ACCOUNTINFO(state, data) {
		for (const key in data) {
			Vue.set(state.accountInfo, key, data[key])
		}
	},
	SET_ACCOUNTINFO(state, payload) {
		state.accountInfo = payload
	},
	SET_LIST(state, payload) {
		const secretKey = jsencrypt.RSAdencrypt(state.accountInfo.secretKey)
		payload.forEach(item => {
			if (item.userMobile && !isPhone(item.userMobile) && !isCnPhone(item.userMobile)) {
				item.userMobile = jsencrypt.Aesdencrypt(item.userMobile, secretKey)
			}
			if (item.userEmail && !isEmail(item.userEmail)) {
				item.userEmail = jsencrypt.Aesdencrypt(item.userEmail, secretKey)
			}
		})
		state.list = payload
	},
	UPDATE_USERINFO(state, { payload = {}, index = 'null' }) {
		const secretKey = jsencrypt.RSAdencrypt(state.accountInfo.secretKey)
		if (payload.userMobile && !isPhone(payload.userMobile) && !isCnPhone(payload.userMobile)) {
			payload.userMobile = jsencrypt.Aesdencrypt(payload.userMobile, secretKey)
		}
		if (payload.userEmail && !isEmail(payload.userEmail)) {
			payload.userEmail = jsencrypt.Aesdencrypt(payload.userEmail, secretKey)
		}

		if (index == 'null') {
			index = state.list.findIndex(item => {
				// if (item.userId == payload.userId) {
				// 	if (item.userMobile && !isPhone(item.userMobile) && !isCnPhone(item.userMobile)) {
				// 		item.userMobile = jsencrypt.Aesdencrypt(item.userMobile, secretKey)
				// 	}
				// 	if (item.userEmail && !isEmail(item.userEmail)) {
				// 		item.userEmail = jsencrypt.Aesdencrypt(item.userEmail, secretKey)
				// 	}
				// }
				return item.userId == payload.userId
			})
		}
		if (index != -1) {
			// const info = Object.assign({}, state.list[index], payload)
			// if (info.userMobile && !isPhone(info.userMobile) && !isCnPhone(info.userMobile)) {
			// 	info.userMobile = jsencrypt.Aesdencrypt(info.userMobile, secretKey)
			// }
			// if (info.userEmail && !isEmail(info.userEmail)) {
			// 	info.userEmail = jsencrypt.Aesdencrypt(info.userEmail, secretKey)
			// }
			// Vue.set(state.list, index, info)
			for (const key in payload) {
				if (key !== 'userId') Vue.set(state.list[index], key, payload[key])
			}
		} else {
			// if (payload.userMobile && !isPhone(payload.userMobile) && !isCnPhone(payload.userMobile)) {
			// 	payload.userMobile = jsencrypt.Aesdencrypt(payload.userMobile, secretKey)
			// }
			// if (payload.userEmail && !isEmail(payload.userEmail)) {
			// 	payload.userEmail = jsencrypt.Aesdencrypt(payload.userEmail, secretKey)
			// }
			state.list.unshift(payload)
		}
	},
	SET_LASTMESSAGE(state, payload) {
		state.lastMessage = payload
	},
	SET_USERCARD(state, payload) {
		state.userCard = payload
	},
	SET_SECRETKEY(state, payload) {
		state.secretKey = payload
	},
	SET_USERCONFIG(state, payload) {
		for (const key in payload) {
			Vue.set(state.userConfig, key, payload[key])
		}
	}
}

const actions = {
	get_userConfig({ commit, state }) {
		return new Promise(async(resolve, reject) => {
			const userConfig = await sqlite.getUserConfig(state.accountInfo.userId.split('_')[0])
			commit('SET_USERCONFIG', userConfig)
			resolve()
		})
	},
	set_userConfig({ commit, state }, data) {
		return new Promise(async(resolve, reject) => {
			await sqlite.setUserConfig(data, state.accountInfo.userId.split('_')[0])
			commit('SET_USERCONFIG', data)
			resolve()
		})
	},
	set_userCard({ commit }, payload) {
		commit('SET_USERCARD', payload)
	},
	set_lastMessage({ state, commit }, lastMessage) {
		return new Promise((resolve, reject) => {
			const curTime = state.lastMessage.timestamp || 0
			if (lastMessage.timestamp && lastMessage.timestamp <= curTime) return resolve()
			sqlite.insertLastMessage(lastMessage).then(res => {
				commit('SET_LASTMESSAGE', lastMessage)
				resolve()
			}).catch(e => {
				reject(e)
			})
		})
	},
	set_accountInfo({ commit, state }, payload) {
		return new Promise((resolve, reject) => {
			setAccountInfo(payload).then(res => {
				payload = Object.assign({}, state.accountInfo, payload)
				commit('SET_ACCOUNTINFO', payload)
				resolve()
			}).catch(e => {
				reject(e)
			})
		})
	},
	set_list({ rootState, state, commit }, payload) {	//	set_list([])
		return new Promise((resolve, reject) => {
			if (payload) {
				commit('SET_LIST', payload)
				resolve()
			} else {
				console.log('只能从外部设置用户数据列表')
			}
		})
	},
	update_info({ rootState, state, commit }, payload = {}) {	//	update_info({userId:	123|456,	type：'...'})
		return new Promise((resolve, reject) => {
			const index = rootState.User.list.findIndex(item => {
				return item.userId == payload.userId
			})
			if (index >= 0) {
				if (payload.reload) {	//	传入单个userId时可配合type==‘reload’进行接口数据更新
					user.pullUserInfo({ userIds: payload.userId }).get().then(res => {
						const newInfo = Object.assign({}, rootState.User.list[index], res.data[0])
						commit('UPDATE_USERINFO', { payload: newInfo, index })
						resolve()
					}).catch(e => {
						reject(e)
					})
				} else {
					// 配合聊天部分的频繁刷新
					commit('UPDATE_USERINFO', { payload, index })
					resolve()
				}
			} else {
				let newUsers = ''
				let userIns = ''
				payload.userId.toString().split('|').forEach(id => {
					const info = rootState.User.list.find(user => {
						return id == user.userId
					})
					info ? (userIns += `${id}|`) : (newUsers += `${id}|`)
				})
				if (!newUsers) return resolve()
				user.pullUserInfo({ userIds: newUsers }).get().then(res => {
					let newList = [...rootState.User.list]
					res.data.map(item => {
						// 	if (userIns.indexOf(item.userId)	>	-1)	{
						if (userIns && userIns.split('|') && userIns.split('|').find(id => {
								return id == item.userId
							})) {
							newList = newList.map(info => {
								const newInfo = item.userId == info.userId ? Object.assign({}, info, item) : info
								return newInfo
							})
						} else {
							newList = [item].concat(newList)
						}
					})

					commit('SET_LIST', newList)
					resolve()
				}).catch(e => {
					reject(e)
				})
			}
		})
	},
	delete_info({ rootState, state, commit }, payload) {	//	delete_info({userId:	123})
		return new Promise((resolve, reject) => {
			const newList = rootState.User.list.filter(item => item.userId != payload.userId)
			commit('SET_LIST', newList)
			resolve()
		})
	},
	set_secretKey({ commit }, payload) {
		commit('SET_SECRETKEY', payload)
	}
}

export default {
	namespaced: true,
	state,
	getters,
	mutations,
	actions
}
