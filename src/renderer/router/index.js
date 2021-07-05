import Vue from 'vue'
import Router from 'vue-router'
import store from '../store'
import { setLang } from '@/assets/lang'
import { remote } from 'electron'

Vue.use(Router)

const router = new Router({
	linkActiveClass: 'active',
	linkExactActiveClass: 'exact-active',
	routes: [
		{
			path: '/',
			name: 'Layout',
			component: require('@/components/common/Layout').default,
			children: [
				{
					path: 'chat',
					component: require('@/pages/chat/index').default,
					meta: {
						requiresAuth: true,
						keepAlive: true
					}
					// beforeEnter: async(to, from, next) => {
						// 刷新界面的时候，如果路径带有会话id，则重新拉取数据并跳转
						// const threadID = to.params.id
						// if (threadID && store.state.Chat.messages.length === 0) {
						// 	const targetThread = store.getters['Chat/someThread'](threadID)
						// 	if (!targetThread) {
						// 		next({ to: '' })
						// 	}

						// 	if (targetThread.lastMessageID) {
						// 		await store.dispatch('Chat/preloadThread', { threadID })
						// 	}
						// 	store.commit('Chat/switchThread', threadID)
						// }
					// 	next()
					// },
					// children: [
					// 	{
					// 		path: ':id',
					// 		name: 'chatMessage',
					// 		component: require('@/pages/chat/message').default,
					// 		meta: {
					// 			requiresAuth: true
					// 		}
					// 	}
					// ]
				},
				{
					path: 'addressBook',
					component: require('@/pages/addressBook/index').default,
					meta: {
						requiresAuth: true
					},
					children: [
						{
							path: ':id',
							component: require('@/pages/addressBook/message').default,
							meta: {
								requiresAuth: true
							}
						}
					]
				},
				{
					path: 'files',
					component: require('@/pages/files/index').default,
					meta: {
						requiresAuth: true
					}
				},
				{
					path: 'collection',
					component: require('@/pages/collection/index').default,
					meta: {
						requiresAuth: true
					}
				},
				{
					path: 'call',
					component: require('@/pages/call/index').default,
					meta: {
						requiresAuth: true
					},
					children: [
						{
							path: ':id',
							component: require('@/pages/call/message').default,
							meta: {
								requiresAuth: true
							}
						}
					]
				}
			]
		},
		{
			path: '/player',
			name: 'player',
			component: require('@/components/player').default,
			children: [
				{
					path: 'player' + process.env.webConfig.CHAT_MSG_TYPE.TYPE_FILE.toString(),
					name: 'filePlayer',
					component: require('@/pages/filePlayer').default
				},
				{
					path: 'player' + process.env.webConfig.CHAT_MSG_TYPE.TYPE_VIDEO.toString(),
					name: 'videoPlayer',
					component: require('@/pages/videoPlayer/index').default
				},
				{
					path: 'player' + process.env.webConfig.CHAT_MSG_TYPE.TYPE_IMAGE.toString(),
					name: 'imagePlayer',
					component: require('@/pages/imagePlayer/index').default
				}
			]
		},
		{
			path: '/',
			name: 'login_reg',
			component: require('@/components/common/login_reg').default,
			children: [
				{
					component: require('@/pages/firstRunLoginReg').default,
					path: 'firstRunLoginReg',
					name: 'firstRunLoginReg',
					meta: {
						keepAlive: false
					}
				},
				{
					component: require('@/pages/login').default,
					path: 'login',
					name: 'login',
					meta: {
						keepAlive: false
					}
				},
				{
					path: 'register',
					name: 'register',
					component: require('@/pages/register').default
				},
				{
					path: 'register2',
					name: 'register2',
					component: require('@/pages/register2').default
				},
				{
					path: 'forgetPsd',
					name: 'forgetPsd',
					component: require('@/pages/forgetPsd').default
				},
				{
					component: require('@/pages/EnterPrise').default,
					path: 'EnterPrise',
					name: 'EnterPrise'
				},
				{
					component: require('@/pages/registerResult').default,
					path: 'registerResult',
					name: 'registerResult'
				},
				{
					path: 'secondVerification',
					name: 'secondVerification',
					component: require('@/pages/secondVerification').default
				}
			]
		},
		{
			path: '/',
			name: 'blankLayout',
			component: require('@/components/common/blankLayout').default,
			children: [
				{
					path: 'realVideo',
					name: 'realVideo',
					component: require('@/pages/realVideo/index').default
				},
				{
					path: 'license',
					name: 'license',
					component: require('@/pages/license').default,
					meta: {
						isNeedCode: false // 不需要校验企业代码
					}
				},
				{
					path: 'about',
					name: 'about',
					component: require('@/pages/about').default,
					meta: {
						isNeedCode: false // 不需要校验企业代码
					}
				},
				{
					path: 'loadNetConfig',
					name: 'loadNetConfig',
					component: require('@/pages/loadNetConfig').default
				},
				{
					path: 'realAudio',
					name: 'realAudio',
					component: require('@/pages/realAudio/index').default
				},
				{
					path: 'update',
					name: 'update',
					component: require('@/pages/update').default,
					meta: {
						isNeedCode: false // 不需要校验企业代码
					}
				}
			]
		}
	]
})

// const whiteList = ['/login', '/register', '/forgetpsd', '/license', '/update', '/imgview', '/shortcut/', '/autoupdate', '/loadnetconfig']// 不重定向白名单

router.beforeEach(async(to, from, next) => {
	/* console.log(to)
	let path = to.path.toLowerCase()
	var isInWhiteList = false
	whiteList.every(item => {
		if (path.indexOf(item.toLowerCase()) > -1) {
			isInWhiteList = true
			return false
		} else {
			return true
		}
	})*/
	if (!window.__winURL) window.__winURL = Vue.prototype.$utils.fun.getGlobalByName('winURL')
	if (!window.__deviceId) window.__deviceId = Vue.prototype.$utils.fun.getGlobalByName('deviceId')
	store.dispatch('Setting/set_fileDomainURL', Vue.prototype.$utils.fun.getGlobalByName('fileDomainURL'))
	store.dispatch('Setting/set_notebookHostURL', Vue.prototype.$utils.fun.getGlobalByName('notebookHostURL'))
	if ((to.path === '/chat' && to.query.resize) || (from.path !== '/register' && to.query.resize && to.path === '/login')) Vue.prototype.$utils.fun.changeWinStyle({ path: to.path })
	let sysConfig = store.state.Setting.sysConfig
	if (!store.state.Setting.sysConfig.appEnv) { // 初始化
		sysConfig = await Vue.prototype.$utils.fun.getSysConfig()
		store.dispatch('Setting/set_sysConfig', {
			target: 'vuex',
			data: sysConfig
		})
		store.dispatch('Setting/set_sys_lang', sysConfig.lang)
		store.dispatch('Setting/set_autoLogin', sysConfig.autoLogin)
		setLang(sysConfig.lang)
	}
	/* let isNeedCode = true // 页面是否需要判断企业代码
	if (to.meta && to.meta.isNeedCode !== undefined) {
		isNeedCode = to.meta.isNeedCode
	}*/
	// 必须输入企业代码，企业代码id为空，说明是第一次启动
	/* if (store.state.Setting.sysConfig.organId === '' && to.path !== '/firstRunLoginReg' && from.path !== '/firstRunLoginReg') {
		next({ path: '/firstRunLoginReg', replace: true })
	}*/
	/* if (isNeedCode && store.state.Setting.sysConfig.isECodeMust && store.state.Setting.sysConfig.organId === '' && to.path !== '/EnterPrise' && from.path !== '/EnterPrise') {
		store.commit('Setting/SET_NEEDPRISEODEFIRSTRUN', true)
		next({ path: '/EnterPrise', replace: true })
	}*/
	if (to.meta && to.meta.requiresAuth) {
		try {
			if (!store.state.User.accountInfo.token) {
				store.commit('updateLoginParams', null)
				store.dispatch('Setting/set_pageLoading', window.i18n.t('common.loading') + '...')
				const accountInfo = await Vue.prototype.$utils.fun.getAccountInfo()
				remote.crashReporter.addExtraParameter('token', accountInfo.token)
				await store.dispatch('User/set_accountInfo', accountInfo)
				// 获取用户多企业共有配置
				await store.dispatch('User/get_userConfig')
				// 获取系统配置从2.3.0移到app.vue里，IsECodeMust需要登录前就获取
				// await store.dispatch('Setting/get_paramsConfig')
				await store.dispatch('Setting/get_organParamsConfig')
				await initData()
				// 获取所有会话
				await store.dispatch('Chat/getAllThreads')
				// 获取系统公告
				await store.dispatch('Chat/getNotify')
				// 获取积分助手信息
				await store.dispatch('Chat/getPointNotify')
				// 获取禁言时间字典
				const banned_time_dict = (await Vue.prototype.$utils.api.public.getOneDicts({ dictType: 'banned_time' }).get()).data
				if (banned_time_dict) {
					store.commit('Chat/updateBannedTimeDict', banned_time_dict)
				}
				await store.dispatch('Chat/getAllEmojis')

				if (to.query.organizationPage !== undefined) {
					store.commit('setOrganizationPage', to.query.organizationPage)
				}
			}
			next()
		} catch (e) {
			console.error('layout@', e)
			store.dispatch('Setting/set_pageLoading', '')
			await Vue.prototype.$utils.fun.logout()
			store.commit('initState')
			next({ path: '/login', query: { resize: true, t: new Date().getTime() }, replace: true })
		}
	} else if (to.meta && !to.meta.requiresAuth) {
		if (to.path.toLowerCase() !== '/autoupdate') {
			// const sysConfig = await Vue.prototype.$utils.fun.getSysConfig()
			// console.log(sysConfig)
			// store.dispatch('Setting/set_autoLogin', sysConfig.autoLogin === 'true')
			// store.dispatch('Setting/set_sysConfig', sysConfig)
		}
		next()
	}
	/* if (isInWhiteList) { // 在免登录白名单，直接进入
		if (from.path.toLowerCase() == '/' && to.path.toLowerCase() !== '/autoupdate') {
			const sysConfig = await Vue.prototype.$utils.fun.getSysConfig()
			store.dispatch('Setting/set_autoLogin', sysConfig.autoLogin === 'true')
			store.dispatch('Setting/set_sysConfig', sysConfig)
		}
		next()
	} else {
		try {
			if (from.path.toLowerCase() == '/' && store.state.Setting.lang === '') {
				store.dispatch('Setting/set_pageLoading', window.i18n.t('common.loading') + '...')
				const accountInfo = await Vue.prototype.$utils.fun.getAccountInfo()
				const sysConfig = await Vue.prototype.$utils.fun.getSysConfig()
				await store.dispatch('User/set_accountInfo', accountInfo)
				store.dispatch('Setting/set_autoLogin', sysConfig.autoLogin === 'true')
				await initData()

				//获取所有会话
				await store.dispatch('Chat/getAllThreads')
				//获取系统公告
				await getNotify()
			}
			next()
		} catch (e) {
			console.error('layout@', e.message)
			alert(e.message)
			if (process.env.NODE_ENV == 'development') Vue.prototype.$utils.fun.exitChat()
			store.dispatch('Setting/set_pageLoading', '')
		}
	}*/
})
router.afterEach((to) => {
	if (to.path !== '/chat') store.dispatch('Setting/set_pageLoading', '')
})

export default router

function initData() { // 加载我的群组, 群组关系列表，我的好友，我的好友群组列表，	用户信息，新的好友统计数据，通话记录
	return new Promise((resolve, reject) => {
		Vue.prototype.$utils.api.user.myGroupsAndUsers().get().then(res => {
			console.log('从服务端获取的群组，好友等数据：', res)
			const { groups, groupUsers, friends, friendGroups, users } = res.data
			Promise.all([
				store.dispatch('MyGrounp/set_list', groups || []),
				store.dispatch('MyGrounp/set_userRelationList', groupUsers || []),
				store.dispatch('MyFriend/set_list', friends || []),
				store.dispatch('MyFriend/set_friendGroups', friendGroups || []),
				store.dispatch('User/set_list', users || []),
				store.dispatch('NewFriend/set_list')
				// store.dispatch('OPcomponent/set_callRecords')
			]).then(res => {
				resolve()
			}).catch(e => reject(e))
		}).catch(e => {
			reject(e)
		})
	})
}

