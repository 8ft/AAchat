import Vue from 'vue'
import { DEFAULT_LANG } from '~/lang/'
// import { Progress } from 'ant-design-vue'
const { ipcRenderer } = require('electron')

const state = {
	sysConfig: {
		loginType: '1',
		areaCode: '+86',
		autoLogin: false, // 自动登录
		organId: '', // 企业id
		organCode: '', // 企业代码
		organName: '', // 企业名称
		hisorganNameList: [] // 企业名称
	},
	loginLoading: false,
	needPriseCodeFirstRun: false, // 需要企业代码，且第一次运行
	lang: '', // 界面用系统语言。
	isMaxCurrentWin: false, // 当前窗口是否最大化
	deviceId: '', // 设备id
	paramsConfig: null,
	organParamsConfig: null,
	fileDomainURL: '', // 文件域名
	notebookHostURL: '', // 笔记域名
	isNetworkOnline: true,
	online: true, // 在线状态
	sdkOnline: true,
	showModal: '', // 全局业务弹框开关
	currentPlayVoice: '', // 当前播放的语音
	pageLoading: { // 页面加载loading
		content: '',
		translucent: false// 是否半透明
	},
	windowsVisibility: true, // 当前窗口是否可见
	onlineStatePollForModel: false,	//	弹框数据的在线状态轮询开关---当前业务(创建群聊/多选面板)都是我的好友
	showSearchFile: false,	// 在文档页面点击搜索展示文档搜索页面
	fileDownloadings:	{},	// 文件下载进度队列--{123:{id:1-2-3,progress:0-100,state:'abort/error/save-error/finished/canceled/progress',localPath:'',fromType:'',other:其他各自所需的数据Obj}
	fileDownloadingFromType: {	// 处理收藏使用的id是消息id导致文件标识（id）一致问题；也便于后期查找问题来源
		'chat-1':	'chatBubble',
		'chat-2':	'chatFile',
		'chat-3':	'fileModule',
		'collect-1': 'collectModule'
	}
}
const mutations = {
	SET_LOGINLOADING(state, value) {
		state.loginLoading = value
	},
	SET_NEEDPRISEODEFIRSTRUN(state, value) {
		state.needPriseCodeFirstRun = value
	},
	SET_ISNETWORKONLINE(state, value) {
		state.isNetworkOnline = value
	},
	SET_ISMAXCURRENTWIN(state, value) {
		state.isMaxCurrentWin = value
	},
	SET_ONLINE(state, payload) {
		// if (state.online != payload) ipcRenderer.send('Update_Online', payload)
		state.online = payload
	},
	SET_SDKONLINE(state, payload) {
		if (state.sdkOnline != payload) ipcRenderer.send('sdk_Online', payload)
		state.sdkOnline = payload
	},
	SET_AUTOLOGIN(state, payload) {
		state.sysConfig.autoLogin = payload
	},
	SET_ORGANID(state, payload) {
		state.sysConfig.organId = payload
	},
	SET_ORGANNAME(state, payload) {
		state.sysConfig.organName = payload
	},
	SET_HISORGANNAMELIST(state, payload) {
		state.sysConfig.hisorganNameList = payload
	},
	SET_ORGANCODE(state, payload) {
		state.sysConfig.organCode = payload
	},
	SET_CURRENTPLAYVOICE(state, obj) {
		state.currentPlayVoice = obj
	},
	SET_SHOWMODAL(state, payload) {
		state.showModal = payload
	},
	SET_SYS_LANG(state, payload) {
		state.sysConfig.lang = payload
	},
	SET_LANG(state, payload) {
		state.lang = payload
	},
	SET_PAGELOADING(state, payload) {
		if (payload) {
			if (payload.translucent) {
				state.pageLoading = {
					content: payload.content,
					translucent: true
				}
			} else {
				state.pageLoading = {
					content: payload,
					translucent: false
				}
			}
		} else {
			state.pageLoading = {
				content: '',
				translucent: false
			}
		}
	},
	SET_ORGANINFO(state, { organName, organCode, organId }) {
		if (organName) state.sysConfig.organName = organName
		if (organCode) state.sysConfig.organCode = organCode
		if (organId) state.sysConfig.organId = organId
	},
	UPDATE_SYSCONFIG(state, data) {
		for (const key in data) {
			Vue.set(state.sysConfig, key, data[key])
		}
	},
	SET_SYSCONFIG(state, payload) {
		payload.loginType = payload.loginType || '1'
		payload.areaCode = payload.areaCode || '+86'
		payload.loginName = payload.loginName || ''
		payload.lastLoginByQr = payload.lastLoginByQr || 0
		payload.organId = payload.organId || ''
		payload.organCode = payload.organCode || ''
		payload.organName = payload.organName || ''
		payload.hisorganNameList = payload.hisorganNameList || []
		state.sysConfig = payload
	},
	SET_WINDOWVISIBILITY(state, payload) {
		state.windowsVisibility = payload
	},
	SET_ONLINESTATEPOLLFORMODEL(state, payload) {
		state.onlineStatePollForModel = payload
	},
	SET_FILEDOMAINURL(state, payload) {
		state.fileDomainURL = payload
	},
	SET_NOTEBOOKHOSTURL(state, payload) {
		state.notebookHostURL = payload
	},
	SET_PARAMSCONFIG(state, params) {
		state.paramsConfig = params
	},
	SET_OGRANPARAMSCONFIG(state, params) {
		state.organParamsConfig = params
	},
	SET_SHOWSEARCHFILE(state, payload) {
		state.showSearchFile = payload
	},
	UPDATE_FILEDOWNLOADINGS(state, payload) {
		Vue.set(state.fileDownloadings, payload.key, payload)
	},
	DEL_FILEDOWNLOADINGS(state, id) {
		// state.fileDownloadings = state.fileDownloadings.filter(item => item.id != id)
		delete state.fileDownloadings[id.replace(/-/g, '')]
	}
}

const actions = {
	get_organParamsConfig({ commit, state }, params) {
		return new Promise((resolve, reject) => {
			// showVoiceCalls-语音，showSecretChat-密聊，showSnapchat-阅后即焚，showDeleteBoth-删除我和对方，showDeleteBothAll-双向撤回，showDestroyPwd-销毁密码
			params = params || 'showVoiceCalls|showSecretChat|showSnapchat|showDeleteBoth|showDeleteBothAll|showDestroyPwd'
			Vue.prototype.$utils.api.public.getOrganParamsByName().get({ paramName: params }).then(res => {
				let tempParams = res.data
				if (state.organParamsConfig) tempParams = Object.assign({}, state.organParamsConfig, tempParams)
				resolve(tempParams)
				console.log('get_organParamsConfig:::', tempParams)
				commit('SET_OGRANPARAMSCONFIG', tempParams)
			}).catch(e => reject(e))
		})
	},
	get_paramsConfig({ commit, state, dispatch }, params) {
		return new Promise((resolve, reject) => {
			params = params || 'clientFileMaxSize|chatMessageOverdue|isECodeMust|allowCreateEnterp'
			Vue.prototype.$utils.api.public.getParamsByName().get({ paramName: params }).then(res => {
				let tempParams = res.data
				if (res.data.allowCreateEnterp) res.data.allowCreateEnterp = res.data.allowCreateEnterp === '1'
				if (res.data.isECodeMust) res.data.isECodeMust = res.data.isECodeMust === '1'
				if (res.data.isECodeMust !== undefined && res.data.isECodeMust !== state.sysConfig.isECodeMust) {
					dispatch('set_sysConfig', {
						data: {
							isECodeMust: res.data.isECodeMust
						}
					})
				}
				if (state.paramsConfig) tempParams = Object.assign({}, state.paramsConfig, tempParams)
				resolve(tempParams)
				console.log('get_paramsConfig:::', tempParams)
				commit('SET_PARAMSCONFIG', tempParams)
			}).catch(e => reject(e))
		})
	},
	set_notebookHostURL({ commit }, data) {
		commit('SET_NOTEBOOKHOSTURL', data)
	},
	set_fileDomainURL({ commit }, data) {
		commit('SET_FILEDOMAINURL', data)
	},
	set_sys_lang({ commit, state }, lang) {
		lang = lang || DEFAULT_LANG
		if (state.sysConfig.lang !== lang) Vue.prototype.$utils.fun.setSysConfig({ lang })
		commit('SET_SYS_LANG', lang)
	},
	set_online({ commit }, data) {
		commit('SET_ONLINE', data)
	},
	set_sdkOnline({ commit }, data) {
		commit('SET_SDKONLINE', data)
	},
	set_sysConfig({ commit, state }, { target, data }) {
		data = Object.assign({}, state.sysConfig, data)
		if (target !== 'vuex') Vue.prototype.$utils.fun.setSysConfig(data)
		commit('SET_SYSCONFIG', data)
	},
	set_pageLoading({ commit }, state) {
		commit('SET_PAGELOADING', state)
	},
	set_autoLogin({ commit, state }, autoLogin) {
		if (state.sysConfig.autoLogin !== autoLogin) {
			const params = {
				autoLogin: autoLogin === true ? 'true' : 'false'
			}
			if (!autoLogin) params.lastLogin = ''
			Vue.prototype.$utils.fun.setSysConfig(params)
		}
		commit('SET_AUTOLOGIN', autoLogin)
	},
	set_organInfo({ commit }, { organName, organCode, organId }) {
		const params = {}
		if (organName) params.organName = organName
		if (organCode) params.organCode = organCode
		if (organId) params.organId = organId
		Vue.prototype.$utils.fun.setSysConfig(params)
		commit('SET_ORGANINFO', params)
	},
	set_organId({ commit }, state) {
		const params = {
			organId: state
		}
		Vue.prototype.$utils.fun.setSysConfig(params)
		commit('SET_ORGANID', state)
	},
	set_hisorganNameList({ commit }, state) {
		const params = {
			hisorganNameList: state
		}
		Vue.prototype.$utils.fun.setSysConfig(params)
		commit('SET_HISORGANNAMELIST', state)
	},
	set_organCode({ commit }, state) {
		const params = {
			organCode: state
		}
		Vue.prototype.$utils.fun.setSysConfig(params)
		commit('SET_ORGANCODE', state)
	},
	set_organName({ commit }, state) {
		const params = {
			organName: state
		}
		Vue.prototype.$utils.fun.setSysConfig(params)
		commit('SET_ORGANNAME', state)
	},
	set_showModal({ commit }, madalName) {
		commit('SET_SHOWMODAL', madalName)
	},
	set_currentPlayVoice({ commit }, obj) {
		commit('SET_CURRENTPLAYVOICE', obj)
	},
	set_windowsVisibility({ commit }, state) {
		commit('SET_WINDOWVISIBILITY', state)
	},
	set_onlineStatePollForModel({ commit }, state) {
		commit('SET_ONLINESTATEPOLLFORMODEL', state)
	},
	set_showSearchFile({ commit }, state) {
		commit('SET_SHOWSEARCHFILE', state)
	},
	update_fileDownloadings({ commit }, state = {}) {
		// 处理泡泡绑定动态监听时key只能是简单的‘.’分隔的值
		state.key = state.id.replace(/-/g, '')
		commit('UPDATE_FILEDOWNLOADINGS', state)
	},
	del_fileDownloadings({ commit }, id) {
		commit('DEL_FILEDOWNLOADINGS', id)
	}
}

const getters = {
	isOnline(state) {
		return state.online && state.sdkOnline
	}
}

export default {
	namespaced: true,
	state,
	mutations,
	actions,
	getters
}
