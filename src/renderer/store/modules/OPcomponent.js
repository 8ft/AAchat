import { message as Message } from 'ant-design-vue'
import Settings from './Setting'
const { hermes } = require('@/utils/electron/api')

const state = {
	userCard: {
		userId: '', // userCard组件使用的userid
		firstModal: '', // 显示的弹窗
		next: '', // 关闭后的动作
		privacyProtection: false // 是否开启保护
	},
	deleteChatConfirm: { // 清除聊天记录确认框
		deleteId: '',
		container: '' // 挂载点，用element的id字符串
	},
	playerWinHide: true,
	isSearch: false, // 是否在
	hasRealCall: false, // 是否在通话中，包括语音和视频
	bubbleRightMenuVisible: false, // 聊天气泡右键菜单显示控制
	callRecords: { // 通话记录
		count: 0,	// 未读数
		list: []
	}
}

const mutations = {
	SET_BUBBLERIGHTMENUVISIBLE(state, payload) {
		state.bubbleRightMenuVisible = payload
	},
	SET_USERCARD(state, payload) {
		if (payload.userId && !Settings.state.online) {
			Message.error(window.i18n.t('common.netErrorTip[0]'))
			return
		}
		state.userCard = payload
	},
	SET_DELETECHATCONFIRM(state, payload) {
		state.deleteChatConfirm = payload
	},
	SET_HASREALCALL(state, payload) {
		state.hasRealCall = payload
	},
	SET_ISSEARCH(state, payload) {
		state.isSearch = payload
	},
	SET_PLAYERWINHIDE(state, payload) {
		state.playerWinHide = payload
	},
	SET_CALLRECORDS(state, payload) {
		state.callRecords = payload
	}
}

const actions = {
	set_playerWinHide({ commit }, payload) {
		commit('SET_PLAYERWINHIDE', payload)
	},
	set_hasRealCall({ commit }, payload) {
		commit('SET_HASREALCALL', payload)
	},
	set_bubbleRightMenuVisible({ commit }, payload) {
		commit('SET_BUBBLERIGHTMENUVISIBLE', payload)
	},
	set_userCard({ commit }, payload) {
		commit('SET_USERCARD', payload)
	},
	set_deleteChatConfirm({ commit }, payload) {
		commit('SET_DELETECHATCONFIRM', payload)
	},
	set_isSearch({ commit }, payload) {
		commit('SET_ISSEARCH', payload)
	},
	set_callRecords({ rootState, commit }, payload) {
		return new Promise((resolve, reject) => {
			if (payload) {
				const	data = Object.assign({}, rootState.OPcomponent.callRecords, payload)
				commit('SET_CALLRECORDS', data)
				resolve(data)
			}	else {
				hermes.getRealCallList().get().then(res => {
					if (rootState.route.fullPath != '/call/recentCall') {
						commit('SET_CALLRECORDS', res.data)
						resolve(res.data)
					} else {
						if (res.data.count > 0) {
							hermes.realCallRead().get().then(res1 => {
								const	data = Object.assign({}, res.data, { count: 0 })
								commit('SET_CALLRECORDS', data)
								resolve(data)
							}).catch(e => reject(e))
						} else {
							commit('SET_CALLRECORDS', res.data)
							resolve(res.data)
						}
					}
				}).catch(e => reject(e))
			}
		})
	}
}
const getters = {
	getBubbleRightMenuVisible(state) {
		return state.bubbleRightMenuVisible
	}
}
export default {
	namespaced: true,
	state,
	getters,
	mutations,
	actions
}
