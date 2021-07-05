// 页面用vuex，不能在electron里用
import Vue from 'vue'
import Vuex from 'vuex'
import modules from './modules'

import * as getters from './getters'
import * as actions from './actions'

Vue.use(Vuex)
export default new Vuex.Store({
	mutations: {
		updateLoginParams(state, params) {
			state.loginParams = params
		},
		initState(state, exclude = []) {
			state.Setting = Object.assign({}, state.Setting, {
				currentPlayVoice: '',
				fileDownloadings: {}
			})

			state.User = Object.assign({}, state.User, {
				list: [],	//	群成员和好友用户详情列表
				accountInfo: { userId: '', nickName: '', userAvatar: '', secretKey: '', accountCode: '', token: '', organId: '', organCode: '', organName: '' },
				lastMessage: {},
				userCard: {
					userId: ''// userCard组件使用的userid
				},
				secretKey: ''
			})

			state.Chat = JSON.parse(JSON.stringify(state.originState.Chat))
			state.OPcomponent = JSON.parse(JSON.stringify(state.originState.OPcomponent))
			state.player = JSON.parse(JSON.stringify(state.originState.player))
			if (!exclude.includes('organizationPage')) {
				state.organizationPage = ''
			}

			if (!exclude.includes('codeValidated')) {
				state.codeValidated = false
			}
		},
		codeValidated(state, val) {
			state.codeValidated = val || true
		},
		setOrganizationPage(state, page) {
			state.organizationPage = page
		},
		updateClearLocalDataTime(state, time) {
			state.clearLocalDataTime = time
		}
	},
	state: {
		loginParams: null,
		codeValidated: false,
		clearLocalDataTime: '0',
		organizationPage: ''
	},
	getters,
	actions,
	modules,
	plugins: [],
	strict: process.env.NODE_ENV !== 'production'
})
