/**
 * 目录
 *
 * ----账号----
 *
 * 注销账号{@link #killAccount}
 *
 *
 *  ----表情----
 *
 * 获取所有表情 {@link #getAllEmojis}
 * 添加表情 {@link #addEmoji}
 * 删除表情 {@link #removeEmoji}
 * 下载表情 {@link #downloadEmoji}
 *
 * ----会话----
 *
 * 加载所有 {@link #getAllThreads}
 * 发起 {@link #openThread}
 * 创建 {@link #createThread}
 * 切换 {@link #switchThread}
 * 预加载 {@link #preloadThread}
 * 更新 {@link #updateThread}
 * 隐藏 {@link #hideThread}
 * 置顶初始化 {@link #setTopInit}
 * 设置/取消置顶 {@link #setTop}
 *
 *
 * ----消息----
 *
 * 发送 {@link #sendMessage}
 * 发送文本 {@link #sendText}
 * 发送文件 {@link #sendFile}
 * 发送文件队列 {@link #setSendFileQueue}
 * 转码视频文件 {@link #videoTransCode}
 * 生成视频缩略图 {@link #makeVideoThumbnail}
 * 发送进度 {@link #sendFileProgress}
 * 再次发送 {@link #resendMessage}
 * 接收 {@link #receiveMessage}
 * 将发送|接收的信息更新到到Vuex及数据库 {@link #saveMsg}
 * 处理发送结果 {@link #sendMsgCallback}
 * 设置聊天记录 {@link #setChatRecordMessage}
 *
 * 查询 {@link #getMsg}
 * 清除 {@link #clearMsg}
 * 删除 {@link #delMsg}
 * 提示 {@link #addTip}
 * 更新 {@link #updateMsg}
 *
 *
 * ----群设置----
 *
 * 删除成员 {@link #removeMember}
 * 转移群主 {@link #transferOwner}
 * 删除会话 {@link #killThread}
 *
 *
 * ----方法----
 *
 * 获取私聊信息 {@link #getPrivateThreadInfo}
 * 获取群聊信息 {@link #getGroupThreadInfo}
 * 调用更新群设置接口 {@link #updateGroupThreadInfo}
 * 获取群聊用户 {@link #getGroupUserList}
 *
 * ----收藏夹------
 * 下载收藏夹的图片、语音 {downloadFavImageAudio}
 * 更新收藏夹 {updateFav}
 */
import { isArray } from 'ant-design-vue/lib/_util/vue-types/utils'
import { message } from 'ant-design-vue'
// import { reject } from 'lodash'
// import { DEFAULT_LANG } from '@/assets/lang'
// import { resolve } from '../../../../../.electron-vue/webpack.base.config'
// import { reject } from 'lodash'
const antMessage = message
// import { FormItem } from 'ant-design-vue/types/form/form-item'

const chatSdk = require('@/utils/electron/chatSdk')
const { user, message: msgApi } = require('@/utils/electron/api')
const fun = require('@/utils/electron/fun')
const sqlite = require('@/utils/electron/sqlite')
const messageUtils = require('@/utils/common/message')
const CHAT_MSG_TYPE = process.env.webConfig.CHAT_MSG_TYPE

/* --------------账号相关--------------*/

/* 注销账号 */
export const killAccount = ({ getters, commit, dispatch }, data) => {
	return new Promise(async(resolve, reject) => {
		// 退出，解除群组
		const threads = `${data.ownGroupId}|${data.singleGroupId}`.split('|')
		threads.forEach(async threadID => {
			if (threadID) await dispatch('killThread', { groupId: threadID, killLocalOnly: true })
		})

		// 删除聊天记录
		await sqlite.deleteChatData({
			where: `senderID='${data.userId}'`
		})
		commit('clearMsg', { userId: data.userId })

		// 如果注销者加入的聊天的最后一条消息是否为他所发，则更新该聊天的最后一条消息
		const joinThreads = data.joinGroupId.split('|')
		let targetThread
		let newLastMessage

		joinThreads.forEach(async threadID => {
			targetThread = getters.someThread(threadID)
			if (targetThread) {
				let memberNum = 1
				if (targetThread.memberNum > 1) {
					memberNum = targetThread.memberNum - 1
				}

				if (targetThread.lastMessage && targetThread.lastMessage.senderID == data.userId) {
					newLastMessage = (await sqlite.getChatData({
						where: `threadID='${threadID}'`,
						order: 'timestamp DESC',
						size: 1
					}))[0]

					if (newLastMessage) {
						await dispatch('updateThread', {
							threadID,
							updatingData: { memberNum, lastMessage: newLastMessage, lastMessageID: newLastMessage.id, lastMessageTimestamp: newLastMessage.timestamp }
						})
					} else {
						await dispatch('updateThread', {
							threadID,
							updatingData: { memberNum, lastMessage: null, lastMessageID: '', lastMessageTimestamp: '' }
						})
					}
				} else {
					await dispatch('updateThread', {
						threadID,
						updatingData: { memberNum }
					})
				}
			}
		})

		resolve()
	})
}

/* 被移出企业 */
export const removeAccount = ({ getters, commit, dispatch }, data) => {
	return new Promise(async(resolve, reject) => {
		// 退出，解除群组
		const threads = `${data.ownGroupId}|${data.joinGroupId}`.split('|')
		let targetThread
		threads.forEach(async threadID => {
			targetThread = getters.someThread(threadID)
			if (targetThread) {
				let memberNum = 1
				if (targetThread.memberNum > 1) {
					memberNum = targetThread.memberNum - 1
				}

				await dispatch('updateThread', {
					threadID,
					updatingData: { memberNum }
				})
			}
		})

		resolve()
	})
}

/* --------------表情相关--------------*/

// 读取所有表情
export const getAllEmojis = ({ commit, dispatch, rootState }) => {
	return new Promise(async(resolve, reject) => {
		// 从服务器获取最新表情数据
		const serverEmojis = await chatSdk.cGetEmoticonAsync()
		if (serverEmojis.code == 0 && serverEmojis.data.length) {
			console.log('最新的表情数据', serverEmojis)
			// 从数据库获取本地存储的表情数据
			const localEmojis = await sqlite.selectData({
				tableName: 'emojis_' + rootState.User.accountInfo.userId.split('_')[0],
				db: 'config'
			})
			console.log('数据库的表情数据', localEmojis)

			let sameEmoji
			const sort = []
			const latestEmojis = {}
			const downloadingEmojis = []
			serverEmojis.data.forEach(serverEmoji => {
				sort.push(serverEmoji.id)
				if (serverEmoji.meta) {
					serverEmoji.meta = JSON.parse(serverEmoji.meta)
				}
				sameEmoji = localEmojis.find(localEmoji => {
					return serverEmoji.id == localEmoji.id
				})
				if (sameEmoji && sameEmoji.localPath) {
					serverEmoji.localPath = sameEmoji.localPath
				} else if (!sameEmoji || !sameEmoji.localPath) {
					downloadingEmojis.push({
						isNew: !sameEmoji,
						data: serverEmoji
					})
				}
				latestEmojis[serverEmoji.id] = serverEmoji
			})
			// console.log('处理后的表情数据：', latestEmojis)
			commit('getAllEmojis', latestEmojis)
			commit('updateEmojiSort', sort)
			commit('setDownloadingEmojis', downloadingEmojis)
			resolve()
		} else {
			commit('getAllEmojis', {})
			commit('updateEmojiSort', [])
			return resolve()
		}
	})
}

// 下载
export const downloadEmoji = ({ state, commit, dispatch, rootState }, emoji) => {
	return new Promise(async(resolve, reject) => {
		try {
			const emojisTableName = 'emojis_' + rootState.User.accountInfo.userId.split('_')[0]
			const uri = emoji.data.uri
			// 下载图片
			const localData = await fun.downloadBySDK({
				url: uri,
				ext: uri.split('.')[1]
			})
			if (localData.localPath === 'error') {
				localData.localPath = ''
			}

			let meta = emoji.data.meta
			if (!meta && localData.width && localData.height) {
				meta = {
					width: localData.width,
					height: localData.height
				}
			}

			if (emoji.isNew) { // 如果数据库中没有该表情
				const insertingData = {
					id: emoji.data.id,
					localPath: localData.localPath,
					uri: emoji.data.uri,
					hash: emoji.data.hash,
					meta,
					updateTime: emoji.data.timestamp
				}

				sqlite.insertData(emojisTableName, insertingData, 'config').then(res => {
					commit('downloadedEmoji', insertingData)
					resolve()
				}).catch(e => {
					resolve()
				})
			} else {
				sqlite.updateData({
					tableName: emojisTableName,
					data: { localPath: localData.localPath, meta },
					where: `id='${emoji.data.id}'`,
					db: 'config'
				}).then(res => {
					commit('updateEmoji', { id: emoji.data.id, data: { localPath: localData.localPath, meta }})
					resolve()
				}).catch(e => {
					resolve()
				})
			}
		} catch (e) {
			console.error('downloadEmoji@', e)
			resolve()
		}
	})
}

// 添加
export const addEmoji = ({ state, commit, dispatch, rootState }, data) => {
	return new Promise(async(resolve, reject) => {
		try {
			const emojis = state.emojis
			const existEmoji = emojis[data.id]
			if (existEmoji) {
				return resolve()
			} else {
				// 下载图片
				const localData = await fun.downloadBySDK({
					url: data.uri,
					ext: data.uri.split('.')[1]
				})

				if (localData.localPath === 'error') {
					localData.localPath = ''
				}

				let meta = data.meta
				if (!meta && localData.width && localData.height) {
					meta = {
						width: localData.width,
						height: localData.height
					}
				} else if (meta) {
					meta = JSON.parse(data.meta)
				}

				const insertingData = {
					id: data.id,
					localPath: localData.localPath,
					uri: data.uri,
					hash: data.hash,
					meta,
					updateTime: data.timestamp
				}

				sqlite.insertData('emojis_' + rootState.User.accountInfo.userId.split('_')[0], insertingData, 'config').then(res => {
					// 添加之后顺便更新排序，将该表情排到第一个
					commit('addEmoji', insertingData)
					resolve()
				}).catch(e => {
					resolve()
				})
			}
		} catch (e) {
			console.log(e)
			resolve()
		}
	})
}

// 删除
export const removeEmoji = ({ state, commit, dispatch, rootState }, ids) => {
	return new Promise((resolve, reject) => {
			sqlite.deleteData({
				tableName: 'emojis_' + rootState.User.accountInfo.userId.split('_')[0],
				where: `id in ('${ids.join(',').replace(/,/g, "','")}')`,
				db: 'config'
			}).then(res => {
				commit('removeEmoji', ids)
				resolve()
			}).catch(e => {
				resolve()
			})
	})
}

/* --------------会话相关--------------*/

/* 加载所有会话 */
export const getAllThreads = ({ rootState, commit, dispatch, rootGetters }) => {
	return new Promise(async(resolve, reject) => {
		// 将所有发送中的消息更新为发送失败
		await sqlite.updateChatData({
			where: `status=0`,
			data: {
				status: 2
			}
		})

		// 删除所有已读的阅后即焚消息
		await sqlite.deleteChatData({
			where: 'isSend=0 and burntAfterRead=1 and triggered=1'
		})

		// 读取数据库会话数据
		const organId = rootState.User.accountInfo.organId
		let threads
		if (organId) {
			threads = await sqlite.getThreadData(`id like '%\_${rootState.User.accountInfo.organId}' or id in ('notify','point')`)
		} else {
			threads = await sqlite.getThreadData()
		}

		// console.log('数据库读取的会话信息', Object.assign({}, threads))

		let thread
		for (let i = 0; i < threads.length; i++) {
			thread = threads[i]
			if (!thread) continue
			if (thread.lastMessageID) {
				thread.lastMessage = (await sqlite.getChatData({
					where: `id='${thread.lastMessageID}'`
				}))[0]
			}

			// 处理异常会话
			if (![0, 1, 10001].includes(parseInt(thread.type))) {
				let threadType = -1
				const friendInfo = rootGetters['MyFriend/groupInfo'](thread.id)
				if (friendInfo && friendInfo.userId) {
					threadType = 0
				} else {
					const groupInfo = rootGetters[`MyGrounp/groupInfo`](thread.id)
					if (groupInfo && groupInfo.groupId) {
						threadType = 1
					}
				}

				if (threadType >= 0) {
					thread.type = threadType
					await sqlite.updateThreadData({
						type: threadType
					}, `id='${thread.id}'`)
				}
			}

			// 获取会话详细信息
			thread = await dispatch('getThreadInfo', thread)
		}

		console.log('处理后的会话信息', Object.assign({}, threads))

		commit('receiveAllThreads', threads)
		resolve()
	})
}

export const getThreadInfo = async({ state, rootState, commit, rootGetters, getters, dispatch }, baseInfo) => {
	const threadType = baseInfo.type
	if (threadType == 10001) {
		return baseInfo
	}

	const threadID = baseInfo.id

	let groupInfo
	if (threadType == 0) {
		const friendInfo = rootGetters['MyFriend/groupInfo'](threadID)
		if (!friendInfo || !friendInfo.userId) {
			if (baseInfo.userId) {
				const status = await getThreadStatus({ userId: baseInfo.userId.split('_')[0] })
				baseInfo.latestStatus = status
			}
			return baseInfo
		}
		const userInfo = rootGetters['User/userInfo'](friendInfo.userId)
		const { nickName, userAvatar, workingStatusId, workingStatusValue, workingStatusExpression } = userInfo
		const { label, notDisturb, burntAfterRead, groupId } = friendInfo

		groupInfo = {
			latestStatus: '4',
			groupName: label || nickName,
			groupAvatar: userAvatar,
			workingStatusId,
			workingStatusValue,
			workingStatusExpression,
			burntAfterRead,
			notDisturb,
			userId: friendInfo.userId,
			groupId
		}
	} else {
		groupInfo = window._.cloneDeep(
			rootGetters['MyGrounp/groupInfo'](threadID)
		)
		if (groupInfo) {
			groupInfo.latestStatus = '8'
		}
	}

	// 如果不存在群组，则返回本地存储的群组基本信息
	if (!groupInfo || !groupInfo.groupId) {
		const status = await getThreadStatus({ groupId: threadID.split('_')[0] })
		baseInfo.latestStatus = status
		return baseInfo
	}

	const {
		groupName: name,
		groupAvatar: avatar,
		...setup
	} = groupInfo

	// 如果群头像昵称有变动，则更新数据库
	const updatingData = {}
	if (name && baseInfo.name != name)updatingData.name = name
	if (avatar && baseInfo.avatar != avatar)updatingData.avatar = avatar
	if (groupInfo.memberNum !== undefined && baseInfo.memberNum != groupInfo.memberNum)updatingData.memberNum = groupInfo.memberNum
	if (groupInfo.notDisturb !== undefined && baseInfo.notDisturb != groupInfo.notDisturb)updatingData.notDisturb = groupInfo.notDisturb

	if (Object.keys(updatingData).length > 0) {
		sqlite.updateThreadData(updatingData, `id='${threadID}'`)
	}

	window._.assign(baseInfo, updatingData, setup)

	if (rootState.Setting.organParamsConfig.showSnapchat == 0 && baseInfo.burntAfterRead == 1) {
		baseInfo.burntAfterRead = 0
	}

	return baseInfo
}

/* 置頂初始化 */
export const setTopInit = ({ state, commit, rootGetters, getters, dispatch }) => {
	user.getTopList().get().then(async res => {
		console.log('最新置顶会话数据：', res)
		if (res.code == 0) {
			const latestTopThreads = []// 最新的置顶会话id
			let targetThread
			if (res.data && res.data.length > 0) {
				let targetThreadID
				let data

				for (let i = 0; i < res.data.length; i++) {
					data = res.data[i]
					targetThreadID = data.businessId == `10001_${data.organId}` ? 'notify' : data.businessId
					latestTopThreads.push(targetThreadID)
					targetThread = getters.someThread(targetThreadID)
					if (!targetThread) {
						let threadType = 1
						const groupInfo = rootGetters['MyGrounp/groupInfo'](targetThreadID)
						if (!groupInfo || !groupInfo.groupId) {
							threadType = 0
						}
						await dispatch('createThread', { threadID: targetThreadID, threadType })
						targetThread = getters.someThread(targetThreadID)
					}
					if (targetThread && (!targetThread.topTime || targetThread.topTime < data.timestamp)) {
						const updatingData = {
							topTime: data.timestamp
						}
						if (targetThread.hidden == 1) {
							updatingData.hidden = 0
						}
						await dispatch('updateThread', { threadID: targetThreadID, updatingData })
					}
				}
			}

			// 取消置顶
			if (state.threads && state.threads.length) {
				for (let i = 0; i < state.threads.length; i++) {
					targetThread = state.threads[i]
					if (targetThread && targetThread.topTime && !latestTopThreads.includes(targetThread.id)) {
						await dispatch('updateThread', { threadID: targetThread.id, updatingData: { topTime: 0 }})
					}
				}
			}
		}
	}).catch(e => {
		console.log('拉取置顶数据异常', e)
	})
}

/* 置頂 */
export const setTop = async({ rootState, commit, dispatch }, thread) => {
	return new Promise(async(resolve, reject) => {
	const opType = thread.topTime ? 0 : 1
	let businessId = thread.id
	let type = thread.type == 0 ? 1 : 0

	if (businessId == 'notify') {
		businessId = `10001_${rootState.User.accountInfo.organId}`
		type = 2
	}

	user.stickyTop({
		businessId,
		opType,
		type
	}).get().then(res => {
		if (res.code == 0) {
			const curTime = fun.getServerTime()
			const updatingData = {
				topTime: opType ? curTime : 0
			}
			if (opType == 0) {
				updatingData.activeTime = curTime
			}
			dispatch('updateThread', { threadID: thread.id, updatingData })
		} else {
			// antMessage.error(`${opType ? '取消' : ''}会话置顶失败`)
			antMessage.error(window.i18n.t('chat.stickyOnTopFailed'))
		}
		resolve()
	}).catch((e) => {
		console.log(e)
		resolve()
	})
})
}

/* 发起会话 */
export const openThread = async({ state, dispatch }, payload) => {
	return new Promise(async(resolve, reject) => {
		const threadID = payload.id
		const res = await dispatch('createThread', { threadID, threadType: payload.type })
		if (res && res.code != 0) {
			return reject(res)
		}

		dispatch('switchThread', { threadID }).then(res => {
			resolve(res)
		}).catch(e => {
			reject(e)
		})
	})
}

/* 创建会话 */
export const createThread = ({ rootState, rootGetters, getters, state, commit, dispatch }, { threadID, threadType, meta, hidden }) => {
	return new Promise(async(resolve, reject) => {
		if (!threadID) {
			return resolve({ code: -1 })
		}

		if (!threadType || ![0, 1, 10001].includes(parseInt(threadType))) {
			const friendInfo = rootGetters['MyFriend/groupInfo'](threadID)
			if (friendInfo && friendInfo.groupId) {
				threadType = 0
			} else {
				const groupInfo = rootGetters[`MyGrounp/groupInfo`](threadID)
				if (groupInfo && groupInfo.groupId) {
					threadType = 1
				} else {
					return resolve({ code: -1 })
				}
			}
		}

		const targetThread = (await sqlite.getThreadData(`id='${threadID}'`))
		if (targetThread.length === 0) { // 如果不存在会话，则创建
			let threadInfo = {
				id: threadID,
				type: threadType,
				unreadCount: 0,
				hidden: hidden || 0,
				notDisturb: 0,
				activeTime: fun.getServerTime('createThread')
			}

			if (threadID == 'notify') {
				threadInfo.name = window.i18n.t('common.systemMessage')
			} else {
				threadInfo = await dispatch('getThreadInfo', threadInfo)
			}

			if (
				!threadInfo.name &&
				meta &&
				 (threadType == 1 || (meta.userId && rootState.User.accountInfo.userId != meta.userId))
			) {
				threadInfo.avatar = threadType == 0 ? meta.userAvatar : meta.groupAvatar
				threadInfo.name = threadType == 0 ? meta.nickName : meta.groupName
				threadInfo.userId = meta.userId || ''
			}

			sqlite.insertThreadData(threadInfo).then(async res => {
				console.log('创建会话  ', threadInfo)
				commit('createThread', { threadInfo })
				resolve(res)
			}).catch(e => {
				resolve(e)
			})
		} else {
			await dispatch('updateThread', { threadID, updatingData: { activeTime: fun.getServerTime('updateThread') }})
			resolve({ code: 0 })
		}
	})
}

/* 切换会话 */
export const switchThread = ({ state, rootState, dispatch, commit, getters }, { threadID, scrollTo }) => {
	return new Promise(async(resolve, reject) => {
		if (!threadID) {
			commit('switchThread', null)
			if (rootState.route.path != '/chat') {
				// 一定要把path,fullPath,params写入，否则无法正常触发导航守卫
				commit('route/ROUTE_CHANGED', {
					to: {
						path: `/chat`,
						fullPath: `/chat`,
						params: {}
					}
				}, { root: true })
			}
			return resolve()
		}
		dispatch('preloadThread', { threadID, scrollTo }).then(res => {
			commit('updateScrollTo', scrollTo)
			commit('switchThread', threadID)
			if (rootState.route.path != '/chat') {
				// 一定要把path,fullPath,params写入，否则无法正常触发导航守卫
				commit('route/ROUTE_CHANGED', {
					to: {
						path: `/chat`,
						fullPath: `/chat`,
						params: {}
					}
				}, { root: true })
			}
			resolve(res)
		}).catch(e => {
			reject(e)
		})
	})
}

/* 预加载会话信息 */
export const preloadThread = ({ state, getters, commit, dispatch }, { threadID, scrollTo }) => {
	return new Promise(async(resolve, reject) => {
		const targetThread = getters.someThread(threadID)
		if (!targetThread) {
			antMessage.error('会话不存在')
			return reject('notExist')
		} else {
			const isLocked = targetThread.type == 1 && targetThread.state == 0
			if (isLocked) {
				antMessage.error(window.i18n.t('chat.lockGroupTip[0]'))
				return reject('isLocked')
			}
		}

		// 更新上个会话激活时间为草稿更新时间，用来给会话排序
		const from = getters.someThread(state.currentThreadID)
		if (from) {
			if (from.draft && from.draft.html && from.draft.updateTime) {
				if (from.draft.updateTime != from.activeTime) {
					dispatch('updateThread', {
						threadID: from.id,
						updatingData: {
							activeTime: from.draft.updateTime
						}
					})
				}
			}

			// 删除上个会话已读的阅后即焚消息
			const deletingMessages = (state.messages && state.messages.length > 0) ? state.messages.filter(msg => {
				return msg.burntAfterRead == 1 && (msg.triggered == 1 || (msg.isSend == 1 && msg.unreadCount == 0))
			}) : []

			if (deletingMessages.length > 0) {
				dispatch('delMsg', {
					threadID: state.currentThreadID,
					ids: deletingMessages.map(msg => {
						return msg.id
					}),
					deleteDatabaseOnly: true,
					deleteBothSide: true
				})
			}
		}

		// 获取所有未归位的消息
		await dispatch('getUnSortedMsgs', threadID)

		// 若隐藏则显示
		if (targetThread.hidden) {
			dispatch('updateThread', {
						threadID,
						updatingData: {
							hidden: 0
						}
					})
		}

		// 加载第一页聊天记录
		let pageSize = state.pageSize
		// 如果未读数大于pageSize,则pageSize等于未读数
		// if (targetThread.unreadCount > pageSize) {
		// 	pageSize = targetThread.unreadCount
		// }

		// 如果有需要滚动到的消息(搜索结果，有人@我，第一条未读)，则第一页数据得至少获取到目标消息，不足一页则拉取一页
		let scrollCount = 0
		let timeOfScrollTo = 0
		if (scrollTo) {
			timeOfScrollTo = scrollTo.timestamp
		} else if (targetThread.firstAtMeTime) { // 第一条有人@我的时间，精确到纳秒，需要转成毫秒
			timeOfScrollTo = new Date(Math.ceil(targetThread.firstAtMeTime / 1000000)).getTime()
			if (targetThread.firstUnreadTime) {
				scrollCount = (await sqlite.selectData({
					select: 'count(*) AS count',
					tableName: 'messages',
					where: `threadID='${threadID}' and timestamp >=${timeOfScrollTo}`,
					order: 'timestamp DESC'
				}))[0].count
				if (scrollCount <= 10) {
					scrollCount = 0
					timeOfScrollTo = targetThread.firstUnreadTime
				}
			}
		} else if (targetThread.firstUnreadTime) {
			timeOfScrollTo = targetThread.firstUnreadTime
		}

		if (timeOfScrollTo && !scrollCount) {
			scrollCount = (await sqlite.selectData({
				select: 'count(*) AS count',
				tableName: 'messages',
				where: `threadID='${threadID}' and timestamp >=${timeOfScrollTo}`,
				order: 'timestamp DESC'
			}))[0].count
		}

		if (scrollCount > pageSize) {
			pageSize = scrollCount + 5
		}

		commit('updatePreloading', true)
		commit('loadMessages', {
			isFirstPage: true, messages: []
		})

		// const startTime = Date.now()
		sqlite.getChatData({
			where: `threadID='${threadID}' and timestamp>=${targetThread.clearTime || 0}`,
			order: 'timestamp DESC',
			size: pageSize
		}).then(firstPageData => {
			// console.log(firstPageData)
			// console.log('读取数据库耗时：', Date.now() - startTime)
			commit('loadMessages', {
				isFirstPage: true, messages: firstPageData
			})
		})

		resolve({ code: 0 })
	})
}

/* 隐藏会话 */
export const hideThread = async({ state, getters, commit, dispatch }, { threadID, timestamp }) => {
	return new Promise(async(resolve, reject) => {
		try {
			if (!threadID) {
				sqlite.deleteThreadData({ threadID: 'is null' })
				commit('killThread', null)
				return resolve()
			}

			const targetThread = getters.someThread(threadID)
			if (!targetThread) return resolve()

			// 如果已经被移除群聊或者群已解散，删除会话记录
			if (targetThread.type == 1 && (targetThread.latestStatus == '6' || targetThread.latestStatus == '9')) {
				sqlite.deleteThreadData({ threadID: `='${threadID}'` }).then(res => {
					commit('killThread', threadID)
				})
			}

			// 是否要隐藏会话
			const hidding = (targetThread.lastMessageTimestamp && targetThread.lastMessageTimestamp < timestamp) ||
						(!targetThread.lastMessageTimestamp && targetThread.clearTime && targetThread.clearTime < timestamp) ||
						(!targetThread.lastMessageTimestamp && !targetThread.clearTime)

			if (hidding) {
				await dispatch('updateThread', {
					threadID,
					updatingData: {
						hidden: 1,
						unreadCount: 0
					}
				})
				// 如果是当前会话，则隐藏后要跳转到空会话
				if (hidding && state.currentThreadID == threadID) {
						commit('switchThread', null)
						// commit('route/ROUTE_CHANGED', { to: { path: '/chat', fullPath: '/chat', params: { id: '' }}}, { root: true })
				}
			}

			// 清空聊天记录
			await dispatch('clearMsg', { threadID, timestamp })
			resolve()
		} catch (e) {
			resolve()
		}
	})
}

/* 更新会话(未读数，消息，最新消息) */
export const updateThread = ({ state, commit, getters, dispatch }, { threadID, updatingData }) => {
	return new Promise(async(resolve, reject) => {
		// 更新数据库
		await sqlite.updateThreadData(updatingData, `id='${threadID}'`)

		// 如果不存在会话，创建
		const thread = getters.someThread(threadID, false)
		if (!thread || !thread.id) { // 如果消息所属会话不存在，则创建
			const res = await dispatch('createThread', { threadID, hidden: 1 })
			if (res && res.code != 0) {
				return resolve(res)
			}
		}

		// 更新VueX
		commit('updateThread', { threadID, updatingData })
		resolve()
	})
}

/* 添加新朋友 */
export const getNewFriend = ({ rootState, rootGetters, getters, state, dispatch, commit }, { friendID, isApplicant, switchToThread = true, content, agreeTime, applyTime, syncBatch }) => {
	return new Promise(async(resolve, reject) => {
		const me = rootState.User.accountInfo
		const friend = rootGetters['User/userInfo'](friendID)
		if (!friend.userId) { return resolve() }

		const threadID = rootGetters['MyFriend/friendInfo'](friendID).groupId
		const targetThread = getters.someThread(threadID, friendID)
		if (!targetThread) { // 如果不存在会话，则创建
			const res = await dispatch('createThread', { threadID, threadType: 0 })
			if (res && res.code != 0) {
				return resolve(res)
			}
		} else if (targetThread.id != threadID) {
			await dispatch('updateThread', {
				threadID: targetThread.id,
				updatingData: { id: threadID }
			})
		}

		const applicant = isApplicant ? me : friend // 发起者
		const reply = isApplicant ? friend : me // 通过着

		const applyTimestamp = applyTime ? parseInt(applyTime) : fun.getServerTime('getNewFriend')// 发起时间
		const organId = rootState.User.accountInfo.organId

		let res
		if (content) {
			res = await dispatch('saveMsg', {
				id: `apply_${applyTimestamp}${organId ? '_' + organId : ''}`,
				threadID,
				senderID: applicant.userId,
				threadType: 0,
				name: applicant.nickName,
				avatar: applicant.userAvatar,
				burntAfterRead: 0,
				atUsers: '',
				text: content,
				isAnoymous: 0,
				cForm: CHAT_MSG_TYPE.TYPE_TEXT,
				status: 1,
				timestamp: applyTimestamp,
				isSend: applicant.userId == me.userId ? 1 : 0,
				syncBatch: syncBatch || ''
			})
		}

		const agreeTimestamp = agreeTime ? parseInt(agreeTime) : fun.getServerTime('getNewFriend')
		res = await dispatch('saveMsg', {
			id: `agree_${agreeTimestamp}${organId ? '_' + organId : ''}`,
			threadID,
			senderID: reply.userId,
			threadType: 0,
			name: reply.nickName,
			avatar: reply.userAvatar,
			burntAfterRead: 0,
			text: window.i18n.t('chat.friendVerification[1]'),
			atUsers: '',
			isAnoymous: 0,
			cForm: CHAT_MSG_TYPE.TYPE_TEXT,
			status: 1,
			timestamp: agreeTimestamp,
			isSend: reply.userId == me.userId ? 1 : 0,
			syncBatch: syncBatch || ''
		})

		switchToThread && await dispatch('switchThread', { threadID })

		resolve(res)
	})
}

/* --------------消息相关--------------*/

/* 加载所有未归位的消息 */
export const getUnSortedMsgs = ({ commit, dispatch }, threadID) => {
	return new Promise(async(resolve, reject) => {
		const msg = await sqlite.getChatData({
			where: `threadID='${threadID}' and status=3`,
			order: 'timestamp DESC'
		})

		if (msg.length > 0) {
			commit('updateUnSortedMsgs', {
				action: 'init',
				msg
			})
		}
		resolve()
	})
}

/* 发送信息 */
export const sendMessage = ({ rootState, state, commit, dispatch, rootGetters, getters }, payload) => {
	return new Promise(async(resolve, reject) => {
		try {
			const { id: threadID, type, burntAfterRead, name, avatar, isAnoymous } = payload.thread
			const { nickName, userAvatar, userId } = rootState.User.accountInfo
			let meta
			if (type != 0) {
				const senderDetail = rootGetters.userDetail(payload.thread.id, userId)
				const { anonym, userLabel } = senderDetail

				meta = { // 群聊源信息
					userId,
					nickName: userLabel || nickName,
					userAvatar: userAvatar,
					groupType: type == null ? 0 : type,
					groupName: name,
					groupAvatar: avatar,
					burntAfterRead,
					isAnoymous: isAnoymous || 0,
					clientType: process.env.webConfig.client_type
				}
				if (payload.thread.isAnoymous == 1 && anonym) {
					meta.nickName = anonym
				}
			} else {
				meta = { // 单聊源信息
					userId,
					nickName,
					userAvatar,
					groupType: type,
					burntAfterRead,
					clientType: process.env.webConfig.client_type
				}
			}

			// 发送的信息
			const commomData = {
				threadID,
				senderID: meta.userId,
				threadType: meta.groupType,
				name: meta.nickName,
				avatar: meta.userAvatar,
				burntAfterRead: meta.burntAfterRead || 0,
				isAnoymous: meta.isAnoymous || 0,
				status: 0,
				isSend: 1,
				read: 1,
				unreadCount: type == 1 ? 0 : 1
			}

			let res = { code: -1 }
			const msg = payload.msg
			if (msg.replyInfo) {
				meta.replyInfo = msg.replyInfo
				commomData.replyInfo = msg.replyInfo
			}

			commomData.atUsers = msg.atUsers || ''
			meta.atUsers = msg.atUsers || ''
			if (msg.text) { // 发送文字
				// 名片
				if (typeof msg.text === 'object') {
					const mType = msg.text.title ? 'chatRecord' : 'card'
					meta.mType = mType
					commomData.mType = mType
					commomData.data = msg.text
				}

				const timestamp = fun.getServerTime('sendMessage1')
				const sendingMsg = window._.assign({}, commomData, {
					id: msg.id || `${timestamp}`,
					timestamp: timestamp,
					cForm: msg.replyInfo ? CHAT_MSG_TYPE.TYPE_REPLY : (meta.mType == 'card' ? CHAT_MSG_TYPE.TYPE_CARD : CHAT_MSG_TYPE.TYPE_TEXT),
					text: msg.text
				})
				res = await dispatch('send', {
					sendingMsg,
					meta
				})
				if (res.code != 0) {
					return resolve(res)
				}
			}

			// 发送表情
			if (msg.emoji) {
				const emojiInfo = state.emojis[msg.emoji]
				const fileInfo = await fun.saveFile({
					cForm: CHAT_MSG_TYPE.TYPE_EMOJI,
					ext: emojiInfo.uri.split('.')[1] || '',
					path: emojiInfo.localPath
				}, 1)
				const { ext, width, height, localPath } = fileInfo

				const timestamp = fun.getServerTime('sendMessage2')
				const sendingMsg = window._.assign({}, commomData, {
					id: msg.id || `${timestamp}`,
					timestamp: timestamp,
					cForm: CHAT_MSG_TYPE.TYPE_EMOJI,
					text: `[${window.i18n.t('common.emoji')}]`,
					url: emojiInfo.uri,
					localPath,
					width,
					height,
					ext
				})

				meta.width = width
				meta.height = height

				res = await dispatch('sendEmoji', {
					sendingMsg,
					meta
				})
				if (res.code != 0) {
					return resolve(res)
				}
			}

			// 发送文件
			const files = msg.files
			if (files && files.length) {
				for (let i = 0; i < files.length; i++) {
					// 将文件保存到本地，得到其本地路径
					const fileInfo = await fun.saveFile(files[i], 1)
					const fileName = files[i].fileName
					const { ext, width, height, fileSize, cForm, localPath, duration } = fileInfo
					console.log('fileInfo::::', fileInfo)
					meta.fileType = ext
					if (cForm === CHAT_MSG_TYPE.TYPE_IMAGE) {
						meta.width = width
						meta.height = height
					}
					if (cForm === CHAT_MSG_TYPE.TYPE_FILE) {
						meta.fileName = fileName
						meta.fileSize = fileSize
						meta.burntAfterRead = 0
						commomData.burntAfterRead = 0
					}
					const timestamp = fun.getServerTime('sendMessage3')
					const sendingMsg = window._.assign({}, commomData, {
						id: timestamp.toString(),
						timestamp: timestamp,
						cForm,
						text: fileInfo.text,
						fileName: fileName,
						ext,
						width,
						height,
						duration: duration || 0,
						isEncode: fileInfo.cForm === CHAT_MSG_TYPE.TYPE_VIDEO ? 0 : 1,
						localPath,
						fileSize
					})
					res = await dispatch('sendFile', {
						sendingMsg,
						meta
					})
					if (res.code != 0) {
						return resolve(res)
					}
				}
			}
			resolve(res)
		} catch (e) {
			reject(e)
		}
	})
}

/* 转发消息 */
export const relayMessage = ({ rootState, rootGetters, state, commit, dispatch, getters }, { messages, groups, merge = null, serverFileExistList = [] }) => {
	return new Promise(async(resolve, reject) => {
		const accountInfo = rootState.User.accountInfo
		const textMsg = [
			CHAT_MSG_TYPE.TYPE_TEXT,
			CHAT_MSG_TYPE.TYPE_CHATRECORD,
			CHAT_MSG_TYPE.TYPE_CARD,
			CHAT_MSG_TYPE.TYPE_NOTE,
			CHAT_MSG_TYPE.TYPE_REPLY
		] // 文本类型的消息体，101文本消息，110笔记，108合并消息记录, 109名片
		const fileMsg = [
			CHAT_MSG_TYPE.TYPE_IMAGE,
			CHAT_MSG_TYPE.TYPE_EMOJI,
			CHAT_MSG_TYPE.TYPE_FILE,
			CHAT_MSG_TYPE.TYPE_VIDEO
		] // 文件类型消息体
		for (let j = 0; j < groups.length; j++) {
			const group = groups[j]
			// 如果不存在会话，先创建
			const targetThread = getters.someThread(group.groupId)
			if (!targetThread) {
				await dispatch('createThread', {
					threadID: group.groupId,
					threadType: group.groupUsers ? 1 : 0
				})
				// if (res && res.code != 0) {
				// 	message.error('转发异常')
				// }
			} else if (targetThread.hidden != 0) {
				// 如果消息所属会话隐藏，则显示
				await dispatch('updateThread', {
					threadID: group.groupId,
					updatingData: { hidden: 0 }
				})
			}
			const meta = {
				userId: accountInfo.userId,
				nickName: accountInfo.nickName,
				userAvatar: accountInfo.userAvatar,
				clientType: process.env.webConfig.client_type
			}
			if (group.groupUsers) { // 群聊
				const senderDetail = rootGetters.userDetail(group.groupId, accountInfo.userId)
				const { anonym, userLabel } = senderDetail
				meta.nickName = userLabel || accountInfo.nickName
				if (group.isAnoymous == 1 && anonym) {
					meta.nickName = anonym
				}
				meta.groupType = 1
				meta.groupName = group.groupName
				meta.groupAvatar = group.groupAvatar
				meta.isAnoymous = group.isAnoymous
			} else { // 私聊
				meta.groupType = 0
				meta.burntAfterRead = group.burntAfterRead
			}
			const items = []
			const commonMergeMsg = []
			for (let i = 0; i < messages.length; i++) {
				const message = messages[i]
				if (message.cForm == 53) {
					continue
				}
				message.data = message.data || {}
				if (message.replyInfo) {
					meta.replyInfo = message.replyInfo
				}
				if (merge) {
					if (message.msg_for_share) {
						commonMergeMsg.push(message)
						continue
					}
					if (fileMsg.indexOf(message.cForm) > -1 && serverFileExistList.indexOf(message.url) === -1) { // 文件不在可用列表中，跳过
						continue
					}
					const tempData = {
						headImgUrl: message.avatar,
						sendUserId: message.senderID,
						msgId: message.id,
						nickName: message.name,
						type: message.cForm,
						fileType: message.ext || '',
						duration: message.duration || 0,
						fileSize: message.fileSize || 0,
						fileName: message.newFileName || message.fileName || '',
						width: message.width || 0,
						height: message.height || 0,
						msgTime: window.$moment(message.timestamp).format('YYYY-MM-DD HH:mm:ss') + '.000000000', // 用于兼容ios和android
						isAnoymous: message.isAnoymous
					}
					let newUploadUrl = ''
					switch (message.cForm) {
						case CHAT_MSG_TYPE.TYPE_TEXT:
							tempData.content = message.text
							break
						case CHAT_MSG_TYPE.TYPE_IMAGE:
							tempData.content = `[${window.i18n.t('common.image')}]`
							newUploadUrl = (await chatSdk.cCopyUploadAsync(message.url)).data
							break
						case CHAT_MSG_TYPE.TYPE_EMOJI:
								tempData.content = `[${window.i18n.t('common.emoji')}]`
								newUploadUrl = (await chatSdk.cCopyUploadAsync(message.url)).data
								break
						case CHAT_MSG_TYPE.TYPE_VOICE:
							// tempData.content = '[语音]'
							// tempData.extra = message.url
							break
						case CHAT_MSG_TYPE.TYPE_FILE:
							tempData.content = `[${window.i18n.t('common.file')}]`
							newUploadUrl = (await chatSdk.cCopyUploadAsync(message.url)).data
							break
						case CHAT_MSG_TYPE.TYPE_VIDEO:
							tempData.content = `[${window.i18n.t('common.video')}]`
							newUploadUrl = (await chatSdk.cCopyUploadAsync(message.url)).data
							break
						case CHAT_MSG_TYPE.TYPE_NOTE:
							tempData.content = `[${window.i18n.t('common.note')}]`
							tempData.extra = message.data.content
							break
						case CHAT_MSG_TYPE.TYPE_CHATRECORD:
							tempData.content = `[${window.i18n.t('chat.chatHistory')}]`
							tempData.extra = JSON.stringify(message.data)
							break
						case CHAT_MSG_TYPE.TYPE_CARD:
							tempData.content = `[${window.i18n.t('common.contactCard')}]`
							tempData.extra = JSON.stringify(message.data)
							break
						case CHAT_MSG_TYPE.TYPE_REPLY:
							tempData.content = `[${window.i18n.t('common.graphicMessage')}]`
							tempData.extra = JSON.stringify({ replyContent: message.text, replyInfo: message.replyInfo })
					}
					if (newUploadUrl) tempData.extra = newUploadUrl
					items.push(tempData)
					continue
				}

				if (await fun.fileExist(message.localPath) || serverFileExistList.indexOf(message.url) > -1 || textMsg.indexOf(message.cForm) > -1) {
					let tempMeta = {
						atUsers: '',
						cForm: message.cForm,
						userId: accountInfo.userId,
						nickName: accountInfo.nickName,
						userAvatar: accountInfo.userAvatar
					}

					tempMeta = Object.assign({}, tempMeta, meta)

					const timestamp = fun.getServerTime('relayMessage1')
					const sendingMsg = {
						atUsers: '',
						avatar: tempMeta.userAvatar,
						burntAfterRead: tempMeta.burntAfterRead || 0,
						cForm: message.cForm,
						id: timestamp.toString(),
						isAnoymous: tempMeta.isAnoymous || 0,
						isSend: 1,
						name: tempMeta.nickName,
						senderID: tempMeta.userId,
						relayFrom: 'chat',
						status: 0,
						text: message.text,
						threadID: group.groupId,
						threadType: tempMeta.groupType,
						timestamp,
						unreadCount: group.groupUsers ? 0 : 1,
						ext: message.ext || '',
						url: message.url || '',
						height: message.height || 0,
						width: message.width || 0,
						fileSize: message.fileSize || 0,
						duration: message.duration || 0,
						fileName: message.newFileName || message.fileName || '',
						thumbnail: message.thumbnail || ''
					}

					switch (message.cForm) {
						case CHAT_MSG_TYPE.TYPE_IMAGE:
						case CHAT_MSG_TYPE.TYPE_EMOJI:
							tempMeta.fileType = message.ext
							tempMeta.width = message.width
							tempMeta.height = message.height
							break
						case CHAT_MSG_TYPE.TYPE_VOICE:
							tempMeta.fileType = message.ext
							break
						case CHAT_MSG_TYPE.TYPE_FILE:
							sendingMsg.burntAfterRead = 0
							tempMeta.burntAfterRead = 0
							tempMeta.fileType = message.ext
							tempMeta.fileSize = message.fileSize
							tempMeta.fileName = message.newFileName || message.fileName
							break
						case CHAT_MSG_TYPE.TYPE_VIDEO:
							tempMeta.fileType = message.ext
							tempMeta.fileSize = message.fileSize
							tempMeta.width = message.width
							tempMeta.height = message.height
							tempMeta.duration = message.duration
							tempMeta.fileName = message.fileName || ''
							break
						case CHAT_MSG_TYPE.TYPE_NOTE:
						case CHAT_MSG_TYPE.TYPE_CHATRECORD:
						case CHAT_MSG_TYPE.TYPE_CARD:
							sendingMsg.data = message.data
							break
					}

					if (message.mType !== 'link') {
						sendingMsg.mType = message.mType || ''
					}
					if (message.replyInfo) {
						sendingMsg.replyInfo = message.replyInfo
					}

					const thread = getters.someThread(group.groupId)
					if (textMsg.indexOf(message.cForm) > -1 || serverFileExistList.indexOf(message.url) > -1) {
						// 保存到VueX跟数据库
						await dispatch('saveMsg', sendingMsg)
						let msgContent = textMsg.indexOf(message.cForm) > -1 ? message.text : message.url
						// 如果是聊天记录
						if (message.cForm === CHAT_MSG_TYPE.TYPE_CHATRECORD) msgContent = JSON.stringify(sendingMsg.data)
						if (message.cForm === CHAT_MSG_TYPE.TYPE_CARD) msgContent = JSON.stringify(sendingMsg.data)
						if (message.cForm === CHAT_MSG_TYPE.TYPE_NOTE) {
							if (typeof sendingMsg.data === 'object') {
								msgContent = sendingMsg.data.content
							} else {
								msgContent = sendingMsg.data
							}
						}
						chatSdk.cRelayAsync(message.cForm, group.groupId, JSON.stringify(tempMeta), msgContent).then(async res => {
							if (res.code === 0) {
								// 如果是聊天记录,要同步更新其包含的消息的threadID
								if (message.cForm === CHAT_MSG_TYPE.TYPE_CHATRECORD) {
									const newMsgID = res.data[0].message.id
									if (newMsgID) {
										await sqlite.updateChatData({
											where: `threadID = '${sendingMsg.id}@${sendingMsg.threadID}'`,
											data: {
												threadID: `${newMsgID}@${sendingMsg.threadID}`
											}
										})
									}
								}

								const receiveRes = {
									code: res.data[0].code,
									data: res.data[0].message
								}
								await dispatch('sendMsgCallback', { msgID: sendingMsg.id, result: receiveRes })
								resolve({ code: 0 })
							} else {
								await dispatch('sendMsgCallback', { msgID: sendingMsg.id, result: res })
								reject(res)
							}
						})
					} else {
						await dispatch('sendMessage', {
							msg: {
								files: [fun.getLocalFIleInfo(message.localPath)]
							},
							thread
						})
					}
				} else {
					reject()
				}
			}

			if (merge) {
				let mergeTitle = ''
				switch (merge.type) {
					case 0:
						// 获取聊天对象信息
						const userInfo = rootGetters['User/userInfo'](merge.userId)
						const { nickName } = userInfo
						// mergeTitle = `${accountInfo.nickName}和${nickName}的聊天记录`
						mergeTitle = window.i18n.t('search.xxxChatHistory[1]', { name1: accountInfo.nickName, name2: nickName })
						break
					case 1:
						// mergeTitle = `${merge.name}群的聊天记录`
						mergeTitle = window.i18n.t('search.xxxChatHistory[0]', { name: merge.name })
				}
				const mergeData = {
					title: mergeTitle,
					items
				}
				if (items.length) {
					commonMergeMsg.push({
						cForm: CHAT_MSG_TYPE.TYPE_CHATRECORD,
						data: mergeData,
						text: window.i18n.t('chat.chatHistory'),
						mType: 'chatRecord'
					})
				}
				for (let i = 0; i < commonMergeMsg.length; i++) {
					const timestamp = fun.getServerTime('relayMessage2')
					const sendingMsg = {
						atUsers: '',
						avatar: meta.userAvatar,
						burntAfterRead: meta.burntAfterRead || 0,
						cForm: commonMergeMsg[i].cForm,
						data: commonMergeMsg[i].data,
						id: timestamp.toString(),
						isAnoymous: meta.isAnoymous || 0,
						isSend: 1,
						mType: commonMergeMsg[i].mType || '',
						name: meta.nickName,
						senderID: meta.userId,
						status: 0,
						text: commonMergeMsg[i].text,
						threadID: group.groupId,
						threadType: meta.groupType,
						timestamp,
						unreadCount: group.groupUsers ? 0 : 1
					}
					await dispatch('saveMsg', sendingMsg)
					chatSdk.cSendAsync(sendingMsg.cForm, false, '', sendingMsg.threadID, JSON.stringify(meta), sendingMsg.cForm === CHAT_MSG_TYPE.TYPE_CHATRECORD ? JSON.stringify(sendingMsg.data) : sendingMsg.text).then(async res => {
						if (res.code === 0) {
							// 如果是聊天记录,要同步更新其包含的消息的threadID
							if (sendingMsg.cForm === CHAT_MSG_TYPE.TYPE_CHATRECORD) {
								const newMsgID = res.data.id
								if (newMsgID) {
									await sqlite.updateChatData({
										where: `threadID like '${sendingMsg.id}%'`,
										data: {
											threadID: `${newMsgID}@${sendingMsg.threadID}`
										}
									})
								}
							}
							resolve({ code: 0 })
						} else {
							reject(res)
						}
						await dispatch('sendMsgCallback', { msgID: sendingMsg.id, result: res })
					})
				}
			}
		}
	})
}
/* 转发收藏消息 */
export const relayCollect = async({ rootState, rootGetters, state, commit, dispatch, getters }, { messages, groups }) => {
	const accountInfo = rootState.User.accountInfo
	for (let i = 0; i < messages.length; i++) {
		const message = messages[i]
		const meta = {
			atUsers: '',
			cForm: message.form,
			userId: accountInfo.userId,
			nickName: accountInfo.nickName,
			userAvatar: accountInfo.userAvatar,
			clientType: process.env.webConfig.client_type
		}
		const data = Object.assign({}, message.meta)
		data.cForm = message.form
		switch (data.cForm) {
			case CHAT_MSG_TYPE.TYPE_IMAGE:
			case CHAT_MSG_TYPE.TYPE_FILE:
			case CHAT_MSG_TYPE.TYPE_VOICE:
			case CHAT_MSG_TYPE.TYPE_VIDEO:
				data.url = message.content
				data.ext = message.meta.fileType
				break
			case CHAT_MSG_TYPE.TYPE_NOTE:
				data.content = message.content
				break
		}
		let othercontent = ''
		switch (message.form) {
			case CHAT_MSG_TYPE.TYPE_IMAGE:
				othercontent = `[${window.i18n.t('common.image')}]`
				meta.fileType = message.meta.fileType || message.meta.ext
				meta.width = message.meta.width
				meta.height = message.meta.height
				break
			case CHAT_MSG_TYPE.TYPE_FILE:
				othercontent = `[${window.i18n.t('common.file')}] ` + message.meta.fileName
				meta.fileType = message.meta.ext || message.meta.fileType
				meta.fileSize = message.meta.fileSize
				meta.fileName = message.meta.fileName
				break
			case CHAT_MSG_TYPE.TYPE_VOICE:
				othercontent = `[${window.i18n.t('common.voice')}]`
				meta.fileType = message.meta.fileType || message.meta.ext
				meta.duration = message.meta.duration
				break
			case CHAT_MSG_TYPE.TYPE_VIDEO:
				othercontent = `[${window.i18n.t('common.video')}]`
				meta.fileType = message.meta.ext || message.meta.fileType
				meta.fileSize = message.meta.fileSize
				meta.width = message.meta.width
				meta.height = message.meta.height
				meta.duration = message.meta.duration
				meta.fileName = message.meta.fileName || ''
				break
			case CHAT_MSG_TYPE.TYPE_NOTE:
				othercontent = `[${window.i18n.t('common.note')}]`
				meta.noteId = message.id
				data.noteId = message.id
				break
		}
		for (let j = 0; j < groups.length; j++) {
			const group = groups[j]
			const tempMeta = window._.assign({}, meta) // 把meta存在tempMeta，防止修改meta后影响下一次循环
			if (group.groupUsers) { // 群聊
				const senderDetail = rootGetters.userDetail(group.groupId, accountInfo.userId)
				const { anonym, userLabel } = senderDetail
				tempMeta.nickName = userLabel || accountInfo.nickName
				if (group.isAnoymous == 1 && anonym) {
					tempMeta.nickName = anonym
				}
				tempMeta.groupType = 1
				tempMeta.groupName = group.groupName
				tempMeta.groupAvatar = group.groupAvatar
				tempMeta.isAnoymous = group.isAnoymous
			} else { // 私聊
				tempMeta.groupType = 0
				tempMeta.burntAfterRead = message.cForm == CHAT_MSG_TYPE.TYPE_FILE ? 0 : group.burntAfterRead
			}
			const timestamp = fun.getServerTime('relayCollect1')
			const sendingMsg = {
				atUsers: '',
				avatar: tempMeta.userAvatar,
				burntAfterRead: tempMeta.burntAfterRead || 0,
				cForm: message.form,
				data,
				id: timestamp.toString(),
				isAnoymous: tempMeta.isAnoymous || 0,
				isSend: 1,
				mType: '',
				name: tempMeta.nickName,
				senderID: tempMeta.userId,
				status: 0,
				text: message.form === CHAT_MSG_TYPE.TYPE_TEXT ? message.content : othercontent,
				threadID: group.groupId,
				threadType: tempMeta.groupType,
				timestamp,
				relayFrom: 'favorite',
				unreadCount: group.groupUsers ? 0 : 1,
				favoriteId: message.id,

				fileName: tempMeta.fileName,
				ext: tempMeta.fileType,
				fileSize: tempMeta.fileSize || data.fileSize || 0,
				width: tempMeta.width || 0,
				height: tempMeta.height || 0,
				url: tempMeta.url || data.url,
				thumbnail: tempMeta.thumbnail,
				duration: tempMeta.duration || 0
			}
			// 保存到VueX跟数据库
			await dispatch('saveMsg', sendingMsg)
			chatSdk.cRelayFavoriteAsync(message.id, group.groupId, JSON.stringify(tempMeta)).then(async res => {
				if (res.code === 0) {
					await dispatch('sendMsgCallback', { msgID: sendingMsg.id, result: { code: res.data[0].code, data: res.data[0].message }})
				}
			})
		}
	}
}
/* 发送文本 */
export const send = ({ state, commit, dispatch }, { sendingMsg, meta }) => {
	return new Promise(async(resolve, reject) => {
		// 保存到VueX跟数据库
		await dispatch('saveMsg', window._.cloneDeep(sendingMsg))
		if (typeof sendingMsg.text === 'object') {
			sendingMsg.text = JSON.stringify(sendingMsg.text)
		}
		// 发送请求，请求成功之后根据返回的code更新本地数据
		chatSdk.cSendAsync(sendingMsg.cForm, false, '', sendingMsg.threadID, JSON.stringify(meta), sendingMsg.text).then(async res => {
			resolve(await dispatch('sendMsgCallback', { msgID: sendingMsg.id, result: res }))
		})
	})
}

/* 发送表情 */
export const sendEmoji = ({ state, commit, dispatch }, { sendingMsg, meta }) => {
	return new Promise(async(resolve, reject) => {
		// 保存到VueX跟数据库
		await dispatch('saveMsg', window._.cloneDeep(sendingMsg))
		// 发送请求，请求成功之后根据返回的code更新本地数据
		chatSdk.cSendEmoticonAsync(false, '', sendingMsg.threadID, JSON.stringify(meta), sendingMsg.url).then(async res => {
			resolve(await dispatch('sendMsgCallback', { msgID: sendingMsg.id, result: res }))
		})
	})
}

export const setSendFileQueue = async({ state, commit, getters }, { action, data }) => {
	// console.log('setSendFileQueue:::', action, data)
	let index
	const tempState = window._.cloneDeep(state.sendFileQueue)
	if (!tempState[data.threadID]) tempState[data.threadID] = []
	// data = window._.assign({}, data)
	switch (action) {
		case 'add':
			tempState[data.threadID].push(data)
			break
		case 'del':
			index = tempState[data.threadID].findIndex(item => {
				return item.msgID == data.msgID
			})
			if (index > -1) {
				if (tempState[data.threadID][index].status === 0) { // 正在上传，删除前得先停止上传
					const message = getters.someMessage(tempState[data.threadID][index].msgID)
					if (message && message.uploadKey) {
						await chatSdk.cUploadCancel(message.uploadKey)
					}
				}
				tempState[data.threadID].splice(index, 1)
				if (!tempState[data.threadID].length) delete tempState[data.threadID]
			}
			break
		case 'modify':
			index = tempState[data.threadID].findIndex(item => {
				return item.msgID === data.msgID
			})
			if (index > -1) tempState[data.threadID][index] = data
			break
		case 'clear':
			console.log('state.messages:::', state.messages)
			for (let i = 0; i < tempState[data.threadID].length; i++) {
				const item = tempState[data.threadID][i]
				if (item.status === 0) {
					const message = getters.someMessage(item.msgID)
					console.log('message.uploadKey：：：', item.msgID)
					if (message && message.uploadKey) {
						await chatSdk.cUploadCancel(message.uploadKey)
					}
				}
			}
			delete tempState[data.threadID]
	}
	commit('setSendFileQueue', tempState)
	return Promise.resolve()
}
/* 发送文件 */
export const sendFile = ({ state, commit, dispatch }, { sendingMsg, meta }) => {
	return new Promise(async(resolve, reject) => {
		// 保存到VueX跟数据库
		await dispatch('saveMsg', sendingMsg)
		// 发送请求，请求成功之后根据返回的code更新本地数据
		const sendInfo = {
			form: sendingMsg.cForm,
			msgID: sendingMsg.id,
			threadID: sendingMsg.threadID,
			meta: JSON.stringify(meta),
			localPath: sendingMsg.localPath
		}
		switch (sendingMsg.cForm) {
			case CHAT_MSG_TYPE.TYPE_IMAGE:
			case CHAT_MSG_TYPE.TYPE_FILE:
				dispatch('setSendFileQueue', { action: 'add', data: sendInfo })
				break
			case CHAT_MSG_TYPE.TYPE_VIDEO:
				if (sendingMsg.isEncode === 1) { // 转发是编码后的文件
					dispatch('setSendFileQueue', { action: 'add', data: sendInfo })
				} else {
					fun.videoTransCode(sendingMsg.localPath, (data) => { // 先转码同时保存到用户文件夹
						commit('videoProgress', {
							msgID: sendingMsg.id,
							progress: data.percent
						})
						if (data.state === 'error') { // 转码失败，当做文件发送
							dispatch('updateMsg', {
								id: sendingMsg.id,
								updatingData: {
									cForm: process.env.webConfig.CHAT_MSG_TYPE.TYPE_FILE,
									burntAfterRead: 0 // 文件没有阅后即焚
								}
							})
							meta.fileName = sendingMsg.fileName
							meta.fileSize = sendingMsg.fileSize
							sendInfo.form = process.env.webConfig.CHAT_MSG_TYPE.TYPE_FILE
							sendInfo.meta = JSON.stringify(meta)
							dispatch('setSendFileQueue', { action: 'add', data: sendInfo })
						}
						if (data.state === 'finished') {
							// 视频转码完成，更新vuex和数据库用于改变转码状态
							dispatch('updateMsg', {
								id: sendingMsg.id,
								updatingData: {
									isEncode: 1,
									ext: '.mp4',
									localPath: data.savePath,
									fileSize: data.videoInfo.targetSize
								}
							})
							// 开始发送视频
							meta.duration = sendingMsg.duration
							meta.fileType = 'mp4'
							meta.height = sendingMsg.height
							meta.width = sendingMsg.width
							meta.fileSize = data.videoInfo.targetSize
							meta.fileName = sendingMsg.fileName || ''
							sendInfo.meta = JSON.stringify(meta)
							sendInfo.localPath = data.savePath
							dispatch('setSendFileQueue', { action: 'add', data: sendInfo })
						}
					})
				}
		}
		resolve({ code: 0 })
	})
}
export const setImagePlayerArray = ({ commit }, data) => {
	commit('setImagePlayerArray', data)
}
export const downloadFavImageAudio = async({ state, commit, dispatch }, { id, fileInfo, form }) => {
	commit('updatefavoriate', { data: { id: id, downloadProgress: 1 }})
	const { url, ext, duration } = fileInfo
	const localData = await fun.downloadBySDK({
		ext, cForm: form, url, duration
	})
	commit('updatefavoriate', { data: { id: id, downloadProgress: 0 }})
	await dispatch('updateFav', { id, data: { localPath: localData.localPath }})
	return Promise.resolve(localData)
}
export const updateFav = async({ state, commit, dispatch }, { id, data }) => {
	// await sqlite.updateCollectData(data, `id='${id}'`)
	// 更新vuex
	data.id = id
	// 将下载的路径更新到数据库与vuex
	await dispatch('updateCollect', { updatemsg: data })
	return Promise.resolve()
}
export const makeVideoThumbnail = ({ rootState, state, commit, dispatch }, { msgID, localPath, url, from }) => {
	return new Promise(async(resolve, reject) => {
		if (state.makeVideoThumbnailArray.indexOf(msgID) >= 0) resolve()
		commit('updateMakeVideoThumbnailArray', {
			action: 'add',
			id: msgID
		})
		const saveThumbnailPath = fun.getGlobalByName('userDataPath').videosPath
		const videoThumbnailName = fun.initFileName('jpg')
		const videoPath = from === 'local' ? localPath : (rootState.Setting.fileDomainURL + url)
		const { videoThumbnail } = await fun.videoThumbnail(videoPath, saveThumbnailPath, videoThumbnailName)
		/* 改变vuex交给调用场景，2.2.0修改， wuxl
    dispatch('updateMsg', {
      id: msgID,
      updatingData: {
        thumbnail: videoThumbnail
      }
    })*/
		commit('updateMakeVideoThumbnailArray', {
			action: 'del',
			id: msgID
		})

		resolve({ thumbnail: videoThumbnail })
	})
}

export const downloadImageVoice = async({ state, commit, dispatch }, { msgID, fileInfo }) => {
	if (state.downloadingMsgs.indexOf(msgID) >= 0) return
	commit('updateDownloadingMsgs', {
		action: 'add',
		id: msgID
	})

	const { cForm, url, ext, duration } = fileInfo
	const localData = await fun.downloadBySDK({
		ext, cForm, url, duration
	})
	/* 2.2.0交由调用downloadImageVoice处处理，wuxl
	dispatch('updateMsg', {
		id: msgID,
		updatingData: localData
	})*/

	commit('updateDownloadingMsgs', {
		action: 'del',
		id: msgID
	})
	return Promise.resolve(localData)
}
/* 获取上传文件进度信息, 返回文件保存的网络地址 */
export const getUploadInfo = async({ dispatch }, key) => {
	const tempData = await chatSdk.cUploadInfo(key)
	if (tempData.length > 4) {
		return Promise.resolve(JSON.parse(tempData.replace(/^100\,/i, '')))
	} else {
		await fun.waiting(100)
		return dispatch('getUploadInfo', key)
	}
}
/* 下载文件进度 */
export const downloadFileProgress = ({ state, commit, dispatch }, { progress, msgID, downloadRate }) => {
	commit('fileProgress', { msgID, progress, downloadRate })
}
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
/* 取消sdk下载 */
export const abortDownloadFileBySDK = async({ dispatch, rootState }, { msgId, count = 0 }) => {
	msgId = msgId.replace(/-/g, '')
	const fileDownloadings = window._.cloneDeep(rootState.Setting.fileDownloadings)
	if (fileDownloadings[msgId]) {
		const downloadKey = fileDownloadings[msgId].downloadKey
		chatSdk.cDownloadCancel(downloadKey)
	} else {
		await fun.waiting(100)
		if (count < 3) dispatch('abortDownloadFileBySDK', { msgId, count: ++count })
	}
}
/* sdk下载文件方法 */
export const downloadFileBySDK = ({ dispatch, rootState }, { type, fileName, msgId, uri, fromType, other }) => {
	fun.c({
		type, fileName
	}).then(async({ state, saveFilePath }) => {
		if (state === 'canceled') {
			dispatch('Setting/del_fileDownloadings', msgId, { root: true })
			return
		}
		// 判断保存路径的文件是否存在，如果存在，在判断是否可写
		/* if (await fun.fileExist(saveFilePath)) {
			if (!await fun.fileWrite(saveFilePath)) {
				// 文件不可写
				dispatch('Setting/update_fileDownloadings', { id: msgId, type, state: 'save-error', fromType, other }, { root: true })
				return
			}
		}*/
		chatSdk.cDownloadAsync(uri, saveFilePath).then(({ data }) => {
			dispatch('downloadFileBySDKProgress', {
				key: data,
				id: msgId,
				type,
				localPath: saveFilePath,
				fromType,
				other
			})
		})
	})
}
/* sdk下载文件进度 */
export const downloadFileBySDKProgress = ({ dispatch, rootState }, { key, id, type, localPath, fromType, other }) => {
	return new Promise(async(resolve, reject) => {
		const tempData = await chatSdk.cDownloadInfo(key)
		console.log('tempData:::', tempData)
		let status = null
		if (tempData.length > 4) {
			status = tempData.replace(/^100\,/i, '')
			const response = timeStampToInt(JSON.parse(status))
			let state = 'finished'
			if (response.code === 5004) { // 取消下载
				state = 'abort'
			}
			dispatch('Setting/update_fileDownloadings', { id, type, downloadKey: key,	state, progress: 100, localPath, fromType, other }, { root: true })
			return resolve({ code: 0, data: response })
		} else {
			const progress = tempData.replace(',', '') * 1
			dispatch('Setting/update_fileDownloadings', { id, type, downloadKey: key,	state: 'progress', progress, localPath, fromType, other }, { root: true })
			return resolve({ code: 1 })
		}
	}).then(async res => {
		if (res.code === 0) {
			return Promise.resolve(res.data)
		} else {
			await fun.waiting(100)
			return dispatch('downloadFileBySDKProgress', { key, id, type, localPath, fromType, other })
		}
	})
}
/* 发送文件进度 */
export const sendFileProgress = ({ state, commit, dispatch, getters }, { key, msgID }) => {
	return new Promise(async(resolve, reject) => {
		const tempData = await chatSdk.cUploadInfo(key)
		// const message = getters.someMessage(msgID)
		let status = null
		if (tempData.length > 4) {
			status = tempData.replace(/^100\,/i, '')
			commit('fileProgress', { msgID, progress: 100, uploadKey: key })
		} else {
			const progress = tempData.replace(',', '') * 1
			commit('fileProgress', { msgID, progress, uploadKey: key })
		}
		if (!status) {
			return resolve({ code: 1 })
		} else {
			// console.log(`sendFileProgress:key=${key}`, status)
			return resolve({ code: 0, data: timeStampToInt(JSON.parse(status)) })
		}
	}).then(async res => {
		if (res.code === 0) {
			return Promise.resolve(res.data)
		} else {
			await fun.waiting(100)
			return dispatch('sendFileProgress', { key, msgID })
		}
	})
}
/* export const sendFileProgress = ({ state, commit }, { key, msgID }) => {
	return new Promise((resolve, reject) => {
		const sendStatus = async(params, msgID1) => {
			const tempData = await chatSdk.cUploadInfo(params)
			let status = null
			if (tempData.length > 4) {
				status = tempData.replace(/^100\,/i, '')
				commit('fileProgress', { msgID: msgID1, progress: 100 })
			} else {
				const progress = tempData.replace(',', '')
				commit('fileProgress', { msgID: msgID1, progress })
			}
			if (!status) {
				setTimeout(() => {
					sendStatus(params, msgID1)
				}, 500)
			} else {
				resolve(JSON.parse(status))
			}
		}
		sendStatus(key, msgID)
	}).then(res => {

	})
}*/

/* 再次发送*/
export const resendMessage = async({ state, commit, dispatch, rootGetters }, { thread, message }) => {
	return new Promise(async(resolve, reject) => {
		const { type, name, avatar, isAnoymous } = thread
		const burntAfterRead = message.cForm == CHAT_MSG_TYPE.TYPE_FILE ? 0 : (thread.burntAfterRead || 0)
		const relayFrom = message.relayFrom
		const updatingData = {
			status: 0
		}
		let meta
		if (type != 0) {
			const senderDetail = rootGetters.userDetail(thread.id, message.senderID)
			const { anonym, userLabel } = senderDetail
			console.log('message:::', Object.assign({}, message))
			meta = { // 群聊源信息
				userId: message.senderID,
				nickName: userLabel || message.name,
				userAvatar: message.avatar,
				groupType: type,
				groupName: name,
				groupAvatar: avatar,
				burntAfterRead,
				atUsers: message.atUsers || '',
				isAnoymous: isAnoymous || 0,
				clientType: process.env.webConfig.client_type
			}

			if (isAnoymous == 1 && anonym) {
				meta.nickName = anonym
				updatingData.isAnoymous = 1
				updatingData.name = anonym
			} else if (message.isAnoymous != isAnoymous) {
				const myInfo = rootGetters.userDetail(thread.id, message.senderID)
				meta.nickName = myInfo.userLabel || myInfo.nickName
				meta.userAvatar = myInfo.userAvatar
			}
		} else {
			meta = { // 单聊源信息
				userId: message.senderID,
				nickName: message.name,
				userAvatar: message.avatar,
				groupType: type,
				burntAfterRead,
				clientType: process.env.webConfig.client_type
			}
		}

		const resendTime = fun.getServerTime('resendMessage')
		updatingData.resendTime = resendTime
		await dispatch('updateMsg', {
			id: message.id,
			updatingData
		})
		const sendInfo = {
			form: message.cForm,
			msgID: message.id,
			threadID: message.threadID,
			localPath: message.localPath || '',
			resendTime
		}
		// 重发id，如果id为整型或者id长度小于14，则不是正确的重发id
		const reid = typeof message.id === 'string' ? (message.id.length > 14 ? message.id : '') : ''
		switch (message.cForm) {
			case CHAT_MSG_TYPE.TYPE_TEXT:
			case CHAT_MSG_TYPE.TYPE_CARD:
			case CHAT_MSG_TYPE.TYPE_CHATRECORD:
			case CHAT_MSG_TYPE.TYPE_NOTE:
				meta.mType = message.mType || ''
				if (meta.mType) {
					message.text = JSON.stringify(message.data)
				}
				if (message.cForm === CHAT_MSG_TYPE.TYPE_NOTE) message.text = message.data
				if (message.cForm === CHAT_MSG_TYPE.TYPE_NOTE && message.relayFrom === 'favorite') {
					chatSdk.cRelayFavoriteAsync(message.favoriteId, message.threadID, JSON.stringify(meta)).then(async res => {
						if (res.code === 0) {
							await dispatch('sendMsgCallback', { msgID: message.id, result: { code: res.data[0].code, data: res.data[0].message }, resendTime })
						}
					})
				} else {
					let content = message.text
					if (CHAT_MSG_TYPE.TYPE_CARD === message.cForm || CHAT_MSG_TYPE.TYPE_CHATRECORD === message.cForm || CHAT_MSG_TYPE.TYPE_NOTE === message.cForm) {
						if (message.cForm === CHAT_MSG_TYPE.TYPE_NOTE) {
							if (typeof message.data === 'object') {
								content = message.data.content
							} else {
								content = message.data
							}
						} else {
							content = JSON.stringify(message.data)
						}
					}
					chatSdk.cSendAsync(message.cForm, false, reid, thread.id, JSON.stringify(meta), content).then(async res => {
						resolve(dispatch('sendMsgCallback', { msgID: message.id, result: res, resendTime }))
					})
				}
				break
			case CHAT_MSG_TYPE.TYPE_REPLY:
				meta.replyInfo = message.replyInfo
				chatSdk.cSendAsync(message.cForm, false, reid, thread.id, JSON.stringify(meta), message.text).then(async res => {
					resolve(dispatch('sendMsgCallback', { msgID: message.id, result: res, resendTime }))
				})
				break
			case CHAT_MSG_TYPE.TYPE_IMAGE:
			case CHAT_MSG_TYPE.TYPE_EMOJI:
				meta.fileType = message.ext
				meta.width = message.width
				meta.height = message.height
				if (relayFrom === 'chat') {
					chatSdk.cRelayAsync(message.cForm, message.threadID, JSON.stringify(meta), message.url).then(async res => {
						if (res.code === 0) {
							const receiveRes = {
								code: res.data[0].code,
								data: res.data[0].message
							}
							await dispatch('sendMsgCallback', { msgID: message.id, result: receiveRes, resendTime })
						} else {
							await dispatch('sendMsgCallback', { msgID: message.id, result: res, resendTime })
						}
					})
				} else if (relayFrom === 'favorite') {
					chatSdk.cRelayFavoriteAsync(message.favoriteId, message.threadID, JSON.stringify(meta)).then(async res => {
						if (res.code === 0) {
							await dispatch('sendMsgCallback', { msgID: message.id, result: { code: res.data[0].code, data: res.data[0].message }, resendTime })
						}
					})
				} else {
					sendInfo.meta = JSON.stringify(meta)
					dispatch('setSendFileQueue', { action: 'add', data: sendInfo })
				}
				break
			case CHAT_MSG_TYPE.TYPE_FILE:
				meta.fileType = message.ext
				meta.fileName = message.fileName
				meta.fileSize = message.fileSize
				if (relayFrom === 'chat') {
					chatSdk.cRelayAsync(message.cForm, message.threadID, JSON.stringify(meta), message.url).then(async res => {
						if (res.code === 0) {
							const receiveRes = {
								code: res.data[0].code,
								data: res.data[0].message
							}
							await dispatch('sendMsgCallback', { msgID: message.id, result: receiveRes, resendTime })
						} else {
							await dispatch('sendMsgCallback', { msgID: message.id, result: res, resendTime })
						}
					})
				} else if (relayFrom === 'favorite') {
					chatSdk.cRelayFavoriteAsync(message.favoriteId, message.threadID, JSON.stringify(meta)).then(async res => {
						if (res.code === 0) {
							await dispatch('sendMsgCallback', { msgID: message.id, result: { code: res.data[0].code, data: res.data[0].message }, resendTime })
						}
					})
				} else {
					sendInfo.meta = JSON.stringify(meta)
					dispatch('setSendFileQueue', { action: 'add', data: sendInfo })
				}
				break
			case CHAT_MSG_TYPE.TYPE_VIDEO:
				meta.duration = message.duration
				meta.fileType = 'mp4'
				meta.height = message.height
				meta.width = message.width
				meta.fileName = message.fileName || ''
				meta.fileSize = message.fileSize
				if (relayFrom === 'chat') {
					chatSdk.cRelayAsync(message.cForm, message.threadID, JSON.stringify(meta), message.url).then(async res => {
						if (res.code === 0) {
							const receiveRes = {
								code: res.data[0].code,
								data: res.data[0].message
							}
							await dispatch('sendMsgCallback', { msgID: message.id, result: receiveRes, resendTime })
						} else {
							await dispatch('sendMsgCallback', { msgID: message.id, result: res, resendTime })
						}
					})
				} else if (relayFrom === 'favorite') {
					chatSdk.cRelayFavoriteAsync(message.favoriteId, message.threadID, JSON.stringify(meta)).then(async res => {
						if (res.code === 0) {
							await dispatch('sendMsgCallback', { msgID: message.id, result: { code: res.data[0].code, data: res.data[0].message }, resendTime })
						}
					})
				} else {
					sendInfo.meta = JSON.stringify(meta)
					dispatch('setSendFileQueue', { action: 'add', data: sendInfo })
				}
		}
	})
}
export const reFileName = ({ commit }, { fileName, threadID, ext, from }) => {
	return new Promise(async(resolve, reject) => {
		// fileNameIndex只参与排序，不参与命名
		let fileNameIndex = 0
		let newFileName = ''
		try {
			const fileArray = await sqlite.getChatData({
				where: `(fileName='${fileName}' or newFileName='${fileName}') and cForm=${CHAT_MSG_TYPE.TYPE_FILE} and threadID='${threadID}' and status=1`,
				order: 'fileNameIndex DESC'
			})
			if (fileArray.length) {
				fileNameIndex = fileArray[0].fileNameIndex + 1
			}
			const tempFIleName = ext ? fileName.replace(new RegExp('.' + ext + '$', 'ig'), '') : fileName
			/* if (fileArray.length === 2) { // 第一个重复文件,
				newFileName = ext ? `${tempFIleName}(1).${ext}` : `${tempFIleName}(1)`
			} else if (fileArray.length > 2) { // 第二个重复文件开始，从上一个文件取角标
				const reg = new RegExp(ext ? `.*\\((\\d+)\\)(\.${ext})$` : `.*\\((\\d+)\\)$`, 'i')
				const regArray = fileArray[0].newFileName.match(reg)
				if (regArray && regArray.length) {
					const tempFileNameIndex = parseInt(regArray[1]) + 1
					newFileName = ext ? `${tempFIleName}(${tempFileNameIndex}).${ext}` : `${tempFIleName}(${tempFileNameIndex})`
				}
			}*/
			if (fileArray.length >= 2) {
				if (fileArray[0].newFileName) {
					const reg = new RegExp(ext ? `.*\\((\\d+)\\)(\.${ext})$` : `.*\\((\\d+)\\)$`, 'i')
					const regArray = fileArray[0].newFileName.match(reg)
					if (regArray && regArray.length) {
						const tempFileNameIndex = parseInt(regArray[1]) + 1
						newFileName = ext ? `${tempFIleName}(${tempFileNameIndex}).${ext}` : `${tempFIleName}(${tempFileNameIndex})`
					}
				} else {
					newFileName = ext ? `${tempFIleName}(1).${ext}` : `${tempFIleName}(1)`
				}
			}
		} catch (e) {
		}
		resolve({
			newFileName,
			fileName,
			fileNameIndex
		})
	})
}
export const sendMsgCallback = ({ state, commit, dispatch, rootGetters, rootState, getters }, { msgID, result, resendTime }) => {
	return new Promise(async(resolve, reject) => {
		console.log(`消息发送结果：${msgID},${JSON.stringify(result)}`)
		try {
			const targetMessage = (await sqlite.getChatData({ where: `id='${msgID}'` }))[0]
			const updatingData = {}
			let status
			// 发送成功
			if (result.code == 0) {
				status = 1
				// 如果为重新发送的
				if (resendTime) {
					// 更新最新消息为该消息
					targetMessage.timestamp = resendTime

					// 将该条消息保存到数据库
					const saveData = { resendTime, timestamp: resendTime }
					const targetThread = getters.someThread(targetMessage.threadID)
					if (targetMessage.threadType == 1 && targetMessage.isAnoymous != targetThread.isAnoymous) {
						const myInfo = rootGetters.userDetail(targetMessage.threadID, targetMessage.senderID)
						saveData.name = myInfo.userLabel || myInfo.nickName
						saveData.avatar = myInfo.userAvatar
						saveData.isAnoymous = targetThread.isAnoymous || 0

						Object.assign(updatingData, {
								name: saveData.nickName,
								avatar: saveData.userAvatar,
								isAnoymous: saveData.isAnoymous
							 })
					}

					if (targetMessage.threadType == 0 && targetMessage.burntAfterRead != targetThread.burntAfterRead) {
						updatingData.burntAfterRead = targetThread.burntAfterRead || 0
					}

					const updaingThreadData = {
						id: targetMessage.threadID,
						lastMessageID: targetMessage.id,
						lastMessageTimestamp: targetMessage.timestamp
					}
					await sqlite.updateChatData({
						where: `id='${targetMessage.id}'`,
						data: saveData,
						updaingThreadData
					})

					updaingThreadData.lastMessage = targetMessage
					commit('updateThread', { threadID: targetMessage.threadID, updatingData: updaingThreadData })

					// 如果该消息为合并转发，需要更新其子消息的threadID
					if (targetMessage.cForm === CHAT_MSG_TYPE.TYPE_CHATRECORD) {
						await sqlite.updateChatData({
							where: `threadID='${targetMessage.id}@${targetMessage.threadID}'`,
							data: {
								threadID: `${result.data.id}@${targetMessage.threadID}`
							}
						})
					}
				}

				updatingData.id = result.data.id || msgID
				updatingData.unreadCount = result.data.unread !== undefined ? result.data.unread : 1
				// 更新消息服务器时间
				if (result.data.time) {
					updatingData.timestamp = Math.ceil(result.data.time / 1000000)
					updatingData.timeStr = result.data.timeStr
				}

				switch (result.data.form) {
					case CHAT_MSG_TYPE.TYPE_TEXT:
						const meta = JSON.parse(result.data.meta)
						updatingData.text = meta.mType ? JSON.parse(result.data.content) : result.data.content
						break
					case CHAT_MSG_TYPE.TYPE_REPLY:
						updatingData.text = result.data.content
						break
					case CHAT_MSG_TYPE.TYPE_FILE:
						updatingData.burntAfterRead = 0
						/* const { newFileName, fileNameIndex } = await dispatch('reFileName', { fileName: targetMessage.fileName, threadID: targetMessage.threadID, ext: targetMessage.ext })
						updatingData.fileNameIndex = fileNameIndex
						updatingData.newFileName = newFileName
						updatingData.text = '[文件] ' + newFileName*/
					// eslint-disable-next-line no-fallthrough
					case CHAT_MSG_TYPE.TYPE_IMAGE:
					case CHAT_MSG_TYPE.TYPE_EMOJI:
					case CHAT_MSG_TYPE.TYPE_VOICE:
					case CHAT_MSG_TYPE.TYPE_VIDEO:
						updatingData.url = result.data.content
						break
					case CHAT_MSG_TYPE.TYPE_NOTE:
						updatingData.data = window._.assign({}, targetMessage.data, result.data)
				}
				dispatch('setImagePlayerArray', {
					action: 'modify',
					targetId: msgID,
					data: {
						messageId: result.data.id
					}
				})
			} else if (result.code == 2010) { // 被对方删除
				status = 2
				if (targetMessage.threadType == 1) {
					await dispatch('addTip', {
						threadID: targetMessage.threadID,
						threadType: 0,
						text: window.i18n.t('chat.groupDisbanded[0]'),
						// timestamp: fun.getServerTime('chat.groupDisbanded[0]'),
						timestamp: targetMessage.timestamp + 1,
						mType: 'tip_notExistGroup'
					})
				} else if (targetMessage.threadType == 0) {
					await dispatch('addTip', {
						threadID: targetMessage.threadID,
						threadType: 0,
						text: window.i18n.t('chat.friendVerification[0]'),
						// timestamp: fun.getServerTime('chat.friendVerification[0]'),
						timestamp: targetMessage.timestamp + 1,
						mType: 'tip_notMyFriend'
					})
				}
			} else if (result.code == 2011) {
				status = 2
				if (targetMessage.threadType == 1) {
					await dispatch('addTip', {
						threadID: targetMessage.threadID,
						threadType: 0,
						text: window.i18n.t('chat.removeGroupChat[0]'),
						// timestamp: fun.getServerTime('chat.removeGroupChat[0]'),
						timestamp: targetMessage.timestamp + 1,
						mType: 'tip_notInGroup'
					})
				} else if (targetMessage.threadType == 0) {
					await dispatch('addTip', {
						threadID: targetMessage.threadID,
						threadType: 0,
						text: window.i18n.t('chat.friendVerification[0]'),
						// timestamp: fun.getServerTime('chat.friendVerification[0]'),
						timestamp: targetMessage.timestamp + 1,
						mType: 'tip_notMyFriend'
					})
				}
			} else if (result.code == 2029) {
				status = 2
				if (targetMessage.threadType == 0) {
					await dispatch('addTip', {
						threadID: targetMessage.threadID,
						threadType: 0,
						text: window.i18n.t('chat.rejectMessage'),
						// timestamp: fun.getServerTime('chat.rejectMessage'),
						timestamp: targetMessage.timestamp + 1,
						mType: 'tip_msgRefused'
					})
				}
			} else if (result.code === 5008) { // 取消发送upload is cancel
				// 因为接口返回的速度太慢，所以对vuex和数据库的操作放在chatbubble/index.vue里
				/* await dispatch('delMsg', {
					deleteDatabaseOnly: false,
					deleteBothSide: false,
					ids: [msgID],
					threadID: targetMessage.threadID
				})*/
				resolve()
				return
			} else { // 发送失败
				if (result.code === 5002 && result.reid) { // 发送超时,用reid替换id，作为重发的id
					updatingData.id = result.reid
				}
				status = 2
			}
			// 更新消息状态
			updatingData.status = status
			await dispatch('updateMsg', {
				id: msgID,
				updatingData
			})
			if (result.code === 0 && result.data.form === CHAT_MSG_TYPE.TYPE_FILE && targetMessage.fileName) { // 文件加入重命名队列
				commit('setReFilaNameQueue', {
					action: 'add',
					data: {
						id: result.data.id,
						fileName: targetMessage.fileName,
						threadID: targetMessage.threadID,
						ext: targetMessage.ext
					}
				})
			}
			resolve(result)
		} catch (e) {
			console.log(e)
			resolve(e)
		}
	})
}

/* 接收信息*/
export const receiveMessage = ({ rootState, dispatch, state, commit, getters }, { message, meta }) => {
	return new Promise(async(resolve, reject) => {
		const threadID = message.threadID
		const thread = getters.someThread(threadID, false)
		let res
		if (!thread || !thread.id) { // 如果消息所属会话不存在，则创建
			res = await dispatch('createThread', { threadID, threadType: message.threadType, meta, hidden: 1 })
			if (res && res.code != 0) {
				return resolve(res)
			}
		} else if (thread.hidden) { // 如果消息所属会话隐藏，则显示
			await dispatch('updateThread', { threadID, updatingData: { hidden: 0 }})
		} else if (!thread.name || !thread.avatar) {
			dispatch('preUpdateThread', { threadID })
		}

		res = await dispatch('saveMsg', message)

		if (!thread) {
			await dispatch('updateThread', { threadID, updatingData: { hidden: 0 }})
		}

		resolve(res)
	})
}

/* 保存消息到本地*/
export const saveMsg = ({ state, commit, rootGetters, rootState, getters, dispatch }, sendingMsg) => {
	return new Promise(async(resolve, reject) => {
		const targetThread = window._.cloneDeep(getters.someThread(sendingMsg.threadID))
		if (!targetThread) return resolve()
		const currentThreadID = state.currentThreadID
		const sendingTime = sendingMsg.timestamp
		let updateUnreadCount = true

		if (sendingMsg.cForm != 53 && sendingMsg.isSend != 1 && sendingMsg.read != 1) {
			// 会话非锁定，且非当前会话或者不在聊天页面，接收到的消息标注为未读
			if (rootState.Setting.windowsVisibility && sendingMsg.threadID == currentThreadID && /\/chat/.test(rootState.route.path)) {
				updateUnreadCount = false
			} else if ((!rootState.Setting.windowsVisibility || !/\/chat/.test(rootState.route.path)) && sendingMsg.threadID == currentThreadID) {
				sendingMsg.read = 0
			}
		} else {
			updateUnreadCount = false
			sendingMsg.read = 1
		}

		// 是否新消息
		const isNew = sendingMsg.status != 3 && (targetThread.lastMessageTimestamp ? (targetThread.lastMessageTimestamp < sendingTime) : true)
		if (isNew) {
			targetThread.lastMessageID = sendingMsg.id
			targetThread.lastMessageTimestamp = sendingTime
			targetThread.activeTime = sendingMsg.timestamp
		}

		// 是否更新会话
		let toUpdateThread = false
		let dataForUpdate = null
		const { id, type, firstAtMeID, firstUnreadTime, unreadCount, lastMessageID, lastMessageTimestamp, activeTime, lastReadMessageTime } = targetThread

		if (isNew) { // 如果是新消息，则更新会话
			toUpdateThread = true
			dataForUpdate = {
				lastMessage: sendingMsg,
				lastMessageID,
				lastMessageTimestamp,
				activeTime
			}
			let newUnreadCount = -1
			if (sendingMsg.cForm != 53 && sendingMsg.read == 1 && unreadCount > 0) {
				// 如果收到一条非透传的已读的消息，且当前会话未读数不为0，则说明是同步历史消息，将未读数设置为0
				newUnreadCount = 0
				if (type == 1) {
					dataForUpdate.firstAtMeID = ''
					dataForUpdate.firstAtMeTime = ''
					dataForUpdate.firstUnreadTime = ''
					dataForUpdate.firstUnreadID = ''
				}
			} else if (sendingMsg.read == 0) {
				newUnreadCount = unreadCount + 1
				// 如果@我
				if (
					type == 1 &&
					!firstAtMeID &&
					state.currentThreadID != sendingMsg.threadID &&
					(
						sendingMsg.atUsers == '0' ||
						(sendingMsg.atUsers !== undefined && sendingMsg.atUsers.split('|').includes(rootState.User.accountInfo.userId))
					)
				) {
					dataForUpdate.firstAtMeID = sendingMsg.id
					dataForUpdate.firstAtMeTime = sendingMsg.timeStr || `${sendingMsg.timestamp}000000`
				}
			}

			if (updateUnreadCount && newUnreadCount >= 0) {
				dataForUpdate.unreadCount = newUnreadCount
				if (newUnreadCount > 0 && ((firstUnreadTime && firstUnreadTime > sendingTime) || !firstUnreadTime)) {
					dataForUpdate.firstUnreadTime = sendingTime
					dataForUpdate.firstUnreadID = sendingMsg.id
				}
			}
		} else if (
			updateUnreadCount &&
			sendingMsg.cForm != 53 &&
			sendingMsg.status != 3 &&
			(unreadCount > 0 || (targetThread.lastMessage && targetThread.lastMessage.cForm == 53))
		) { // 如果不是新消息，会话的未读数不为零或会话的最后一条消息为透传，则说明是在同步历史
			// 若未读
			if (sendingMsg.read == 0) {
				if (!lastReadMessageTime || sendingTime > lastReadMessageTime) {
					toUpdateThread = true
					// 未读数+1
					dataForUpdate = {
						unreadCount: unreadCount + 1
					}

					if ((firstUnreadTime && firstUnreadTime > sendingTime) || !firstUnreadTime) {
						dataForUpdate.firstUnreadTime = sendingTime
						dataForUpdate.firstUnreadID = sendingMsg.id
					}
				}

				// 如果@我
				if (
					type == 1 &&
					(
						sendingMsg.atUsers == '0' ||
						(sendingMsg.atUsers !== undefined && sendingMsg.atUsers.split('|').includes(rootState.User.accountInfo.userId))
					)
				) {
					toUpdateThread = true
					if (dataForUpdate) {
						dataForUpdate.firstAtMeID = sendingMsg.id
						dataForUpdate.firstAtMeTime = sendingMsg.timeStr || `${sendingTime}000000`
					} else {
						dataForUpdate = {
							firstAtMeID: sendingMsg.id,
							firstAtMeTime: sendingMsg.timeStr || `${sendingTime}000000`
						}
					}
				}
			}
		}

		// 更新最后一条已读消息的时间
		if (sendingMsg.cForm != 53 && sendingMsg.status != 3 && sendingMsg.isSend != 1 && sendingMsg.read == 1 && (!lastReadMessageTime || lastReadMessageTime < sendingTime)) {
			toUpdateThread = true
			if (dataForUpdate) {
				dataForUpdate.lastReadMessageTime = sendingTime
			} else {
				dataForUpdate = { lastReadMessageTime: sendingTime }
			}
		}

		// 如果是加入群聊的消息，更新自己在当前群组的状态
		if (targetThread.type == 1 && sendingMsg.mType == 'tip_joinGroup' && targetThread.latestStatus != '8') {
			toUpdateThread = true
			if (dataForUpdate) {
				dataForUpdate.latestStatus = '8'
			} else {
				dataForUpdate = { latestStatus: '8' }
			}
		}

		sendingMsg.originID = sendingMsg.id

		await sqlite.insertChatData(sendingMsg, dataForUpdate)
			.then(async res => {
				if (sendingMsg.status == 3) {
					commit('updateUnSortedMsgs', {
						action: 'add',
						msg: sendingMsg
					})
				}

				// 如果是聊天记录,将包含的消息先保存到数据库
				if (sendingMsg.cForm === CHAT_MSG_TYPE.TYPE_CHATRECORD) {
					let childMsgData
					const baseID = sendingMsg.id
					let msgID
					for (let i = 0; i < sendingMsg.data.items.length; i++) {
						msgID = `${baseID}_${i}`
						childMsgData = messageUtils.getChildMsgData(`${sendingMsg.id}@${sendingMsg.threadID}`, sendingMsg.data.items[i], msgID)
						await sqlite.insertChatData(childMsgData)
					}
				}

				const isHistory = sendingMsg.timestamp < rootState.User.accountInfo.timestamp
				if (!isHistory && sendingMsg.threadID == currentThreadID) {
					commit('receiveMessage', sendingMsg)
				}

				if (toUpdateThread) {
					commit('updateThread', { threadID: id, updatingData: dataForUpdate })
				}

				resolve(res)
			}).catch(e => {
				resolve(e)
			})
	})
}

/**
 * 更新消息
 * @param id 更新一条时传入该消息的id
 * @param {Array} ids 更新多条的时候传入由这些消息的id组成的数组
 * @param {Object} updatingData 要更新的内容
 * @param {Array} readIDs 已读的非触发类型消息id，用于同步已读状态
 * @param {Boolean} updateDatabaseOnly 只更新数据库，默认不传，当需要保持VueX不变时使用
 */
export const updateMsg = ({ state, commit, getters, dispatch }, { id, ids, updatingData = {}, readIDs, updateDatabaseOnly }) => {
	return new Promise(async(resolve, reject) => {
		try {
			let where = ''
			let threadID = ''
			let targetThread = null
			let updaingThreadData = null
			let targetMessage = null

			// 更新多条
			if (ids) {
				where = `id in ('${ids.join(',').replace(/,/g, "','")}')`
				const targetMessages = (await sqlite.getChatData({ where }))
				// 如果本地不存在这些消息，则不处理
				if (targetMessages.length === 0) return resolve({ code: 0 })

				threadID = targetMessages[0].threadID
				targetThread = getters.someThread(threadID)

				if (updatingData.unreadCount !== -1) {
					targetMessages.forEach(targetMessage => {
						window._.assign(targetMessage, updatingData)
						// 如果更新消息为最后一条，则同时更改所属会话lastMessage
						if (targetThread && targetThread.lastMessageID == targetMessage.id) {
							updaingThreadData = {
								id: threadID,
								lastMessage: targetMessage,
								lastMessageID: targetMessage.id,
								lastMessageTimestamp: targetMessage.timestamp
							}
						}
					})
				}
			} else { // 更新单条
				where = `id='${id}'`
				targetMessage = (await sqlite.getChatData({ where }))[0]

				// 如果本地不存在这些消息，则不处理
				if (!targetMessage) return resolve({ code: 0 })

				threadID = targetMessage.threadID
				targetThread = getters.someThread(threadID)

				// 如果是更新阅后即焚消息为已读
				if (targetMessage.burntAfterRead == 1 && updatingData.unreadCount == 0) {
					// 且不在当前会话，则删除该阅后即焚消息
					if (threadID != state.currentThreadID) {
						dispatch('delMsg', {
							threadID: threadID,
							ids: [targetMessage.id],
							deleteDatabaseOnly: true
						})
						updaingThreadData = 'no need to update'
					} else {
						updatingData.triggered = 1
					}
				}

				// 如果更新消息为最后一条，则同时更改所属会话lastMessage
				if (targetThread && (targetThread.lastMessageID == id || (updatingData.timestamp && targetThread.lastMessageTimestamp < updatingData.timestamp))) {
					const { unreadCount, ...others } = updatingData
					if (unreadCount == -1) {
						others.unreadCount = targetMessage.unreadCount - 1
					} else if (unreadCount !== undefined) {
						others.unreadCount = unreadCount
					}
					window._.assign(targetMessage, others)

					updaingThreadData = {
						id: threadID,
						lastMessage: targetMessage,
						lastMessageID: targetMessage.id,
						lastMessageTimestamp: targetMessage.timestamp
					}
				}
			}

			if (updaingThreadData !== 'no need to update') {
				sqlite.updateChatData({
					where: where,
					data: updatingData,
					updaingThreadData
				}).then(res => {
					if (targetThread && threadID == state.currentThreadID && !updateDatabaseOnly) {
						commit('updateMsg', { id, ids, updatingData })
					}

					// 如果是当前会话，且目标消息的排序有误，则更新排序
					if (threadID == state.currentThreadID && targetMessage) {
						targetMessage = getters.someMessage(targetMessage.id) // 获取更新后的目标消息
						if (targetMessage) {
							const targetMsgIndex = state.messages.findIndex(msg => {
								return msg.id == targetMessage.id
							})
							const nextMsg = state.messages[targetMsgIndex + 1]
							if (nextMsg && nextMsg.timestamp < targetMessage.timestamp) {
								console.log('消息位置错乱，进行矫正:', { text: targetMessage.text, timestamp: targetMessage.timestamp }, { text: nextMsg.text, timestamp: nextMsg.timestamp })
								commit('removeMessageByIndex', targetMsgIndex)
								commit('receiveMessage', targetMessage)
							}
						}
					}

					if (updaingThreadData) {
						commit('updateThread', { threadID, updatingData: updaingThreadData })
					}

					if (updatingData.read == 1) {
						const data = ids ? (readIDs ? readIDs.join(',') : null) : id
						if (data) {
							chatSdk.cReadAsync(data)
						}
					}
					resolve(res)
				}).catch(e => {
					reject(e)
				})
			} else {
				resolve({ code: 0 })
			}
		} catch (e) {
			console.log(e)
			resolve(e)
		}
	})
}

/* 获取收藏的消息 */
export const getFavorite = ({ state, commit, dispatch }, { minTime, maxTime }) => {
	return new Promise(async(resolve, reject) => {
		chatSdk.cGetFavoriteAsync(minTime, maxTime || '0', 20, 1).then(async res => {
			if (res.code == 0 && res.data.length === 20) {
				resolve(res.data.concat((await dispatch('getFavorite', {
					minTime: '0',
					maxTime: `${String(res.data[res.data.length - 1].time)}`
				}))))
			} else if (res.code == 0 && res.data.length > 0) {
				resolve(res.data)
			} else {
				resolve([])
			}
		}).catch(e => {
			resolve([])
		})
	})
}

/* 保存收藏 */
export const saveCollect = ({ state, dispatch, commit }, data) => {
	return new Promise(async(resolve, reject) => {
		if (isArray(data)) {
			data.forEach(item => {
				sqlite.insertCollectData(item).then(res => {
					resolve(res)
				}).catch(e => {
					resolve(e)
				})
			})
		} else {
			sqlite.insertCollectData(data).then(res => {
				resolve(res)
			}).catch(e => {
				resolve(e)
			})
		}
	})
}

/* 添加收藏 */
export const addCollect = ({ state, dispatch, commit, rootState }, { collectID }) => {
	return new Promise(async(resolve, reject) => {
		const meta = {
			userAvatar: collectID.avatar,
			userId: collectID.senderID,
			nickName: collectID.name
		}
		if (collectID.cForm === CHAT_MSG_TYPE.TYPE_IMAGE) { // 图片
			meta.fileType = collectID.ext
			meta.width = collectID.width
			meta.height = collectID.height
			meta.fileSize = collectID.fileSize
		} else if (collectID.cForm === CHAT_MSG_TYPE.TYPE_FILE) { // 文件
			meta.fileType = collectID.ext
			meta.fileSize = collectID.fileSize
			meta.fileName = collectID.newFileName || collectID.fileName
			meta.localPath = collectID.localPath
			meta.url = collectID.url
		} else if (collectID.cForm === CHAT_MSG_TYPE.TYPE_VOICE) { // 语音
			meta.fileType = collectID.ext
			meta.duration = collectID.duration
		} else if (collectID.cForm === CHAT_MSG_TYPE.TYPE_VIDEO) { // 视频
			meta.fileType = collectID.ext
			meta.fileSize = collectID.fileSize
			meta.width = collectID.width
			meta.height = collectID.height
			meta.duration = collectID.duration
			meta.localPath = collectID.localPath
			meta.fileName = collectID.fileName || ''
			meta.url = collectID.url
			meta.isEncode = collectID.isEncode
			meta.rotation = collectID.rotation
		} else if (collectID.cForm === CHAT_MSG_TYPE.TYPE_TEXT && collectID.mType === 'link') { // 文字信息中的链接
			if (collectID.data.webTitle !== '') {
				meta.mytype = 'link'
				meta.data = {
					shareLink: collectID.data.shareLink,
					webTitle: collectID.data.webTitle,
					webDescription: collectID.data.webDescription
				}
			}
			// meta.mytype = 'link'
		}
		var content = ''
		if (collectID.cForm === CHAT_MSG_TYPE.TYPE_TEXT) {
			content = collectID.text
		} else if (collectID.cForm === CHAT_MSG_TYPE.TYPE_NOTE) {
			if (typeof collectID.data === 'object') {
				content = collectID.data.content
			} else {
				content = collectID.data
			}
		} else {
			const isinserver = await fun.urlExist(collectID.url)
			/* 发送失败时或本地文件存在服务器过期时点击收藏，要重新上传文件*/
			if (collectID.status === 2 || !isinserver && collectID.localPath) {
				await chatSdk.cUploadAsync(collectID.localPath).then(async path => {
					const retrypath = await dispatch('getUploadInfo', path.data)
					content = retrypath.data
				})
			} else {
				content = collectID.url
			}
		}
		await chatSdk.cPutFavoriteAsync(collectID.id, collectID.senderID, collectID.name, JSON.stringify(meta), content, collectID.cForm).then(async res => {
			// if (res.code === 0) {
			// 	chatSdk.cGetFavoriteAsync('0', '0', 3, 1).then(async data => {
			// 		// pc自己添加的收藏先不存数据库只更新vuex，原因是有可能导致当拉取收藏记录过程中失败时，添加的新收藏却成功时，就会存入数据库导致下次拉取不能从失败的地方重新拉取而是从新添加的收藏开始拉取
			// 		await commit('updatefavoriate', { data: data.data[0] })
			// 		// await dispatch('saveCollect', data.data[0]).then(res => {
			// 		// 	if (res.code !== 0) dispatch('updateCollect', { updatemsg: data.data[0] })
			// 		// })
			// 	})
			// }
			resolve(res)
			// } else if (res.code === 2028) {
			// 	if (collectID.localPath) {
			// 		await dispatch('addCollect', { collectID: collectID, haveloacpath: 1 })
			// 	} else {
			// 		resolve(res)
			// 	}
			// } else {
			// 	resolve(res)
			// }
		})
	})
}

/* 删除收藏 */
export const deletCollect = ({ state, dispatch, commit }, { collectID, clearall }) => {
	return new Promise(async(resolve, reject) => {
		if (clearall) {
			await sqlite.deleteCollectData({ where: `sender='${clearall.userId}'` }).then(async res => {
				await sqlite.getCollectData({
					size: 30, order: 'time desc'
				}).then(alreadydele => {
					commit('getcollectList', alreadydele)
				})
				resolve()
			}).catch(err =>	{
				resolve(err)
			})
		} else {
			chatSdk.cDeleteFavoriteAsync(collectID).then(async res => {
				await sqlite.deleteCollectData({ collectID: collectID }).then(async res => {
					await commit('deletdfavoriate', collectID)
				})
				resolve(res)
			}).catch(err =>	{
				resolve(err)
			})
		}
	})
}

/* 更新收藏 */
export const updateCollect = ({ state, dispatch, commit }, { updatemsg, isnote }) => {
	return new Promise(async(resolve, reject) => {
		await sqlite.updateCollectData({ data: updatemsg, where: `id='${updatemsg.id}'` }).then(async res => {
			await commit('updatefavoriate', { data: updatemsg, isnote: isnote })
			resolve(res)
		})
	})
}

/**
 * 清空消息
 * @param exclude 不包含的内容
 */
export const clearMsg = ({ state, getters, commit, dispatch }, { threadID, userId, exclude, timestamp }) => {
	return new Promise(async(resolve, reject) => {
		if (!timestamp) {
			timestamp = fun.getServerTime('clearMsg')
		}

		const targetThread = getters.someThread(threadID)
		if (!targetThread) {
			return resolve({ code: 0 })
		}

		let updatingThreadData = null
		let lastTip = null
		if (targetThread.lastMessageTimestamp && targetThread.lastMessageTimestamp < timestamp) {
			updatingThreadData = {
				id: threadID,
				unreadCount: 0,
				lastMessageID: '',
				lastMessageTimestamp: ''
			}

			if (!userId) {
				updatingThreadData.clearTime = timestamp
			}

			if (exclude) {
				lastTip = (await sqlite.getChatData({
					where: `threadID='${threadID}' and status!=3 and ${exclude}  and timestamp<${timestamp}`,
					order: 'timestamp DESC',
					size: 1
				}))[0]
				if (lastTip) {
					updatingThreadData.lastMessageID = lastTip.id
					updatingThreadData.lastMessageTimestamp = lastTip.timestamp
				}
			}
		} else if (!userId && !targetThread.lastMessageTimestamp && targetThread.clearTime && targetThread.clearTime < timestamp) {
			updatingThreadData = {
				id: threadID,
				clearTime: timestamp
			}
		} else if (!userId && !targetThread.lastMessageTimestamp && !targetThread.clearTime) {
			updatingThreadData = {
				id: threadID,
				clearTime: timestamp
			}
		}

		// 如果包含文件，删除本地文件
		const files = await sqlite.getChatData({
			where: `threadID='${threadID}'${userId ? `and senderID='${userId}'` : ''} and cForm in ('${CHAT_MSG_TYPE.TYPE_IMAGE}','${CHAT_MSG_TYPE.TYPE_VOICE}','${CHAT_MSG_TYPE.TYPE_VIDEO}') and timestamp<${timestamp}`
		})

		sqlite.deleteChatData({
			where: `threadID like '%${threadID}'${userId ? ` and senderID='${userId}'` : ''}${exclude ? ` and ${exclude}` : ''} and timestamp<${timestamp}`,
			updatingThreadData
		}).then(async res => {
			if (updatingThreadData) {
				updatingThreadData.lastMessage = exclude ? lastTip : null
				commit('updateThread', { threadID, updatingData: updatingThreadData })
			}

			await dispatch('progressQueue', { messageId: 'all', threadId: threadID, senderId: userId, timestamp })

			if (threadID == state.currentThreadID) {
				if (state.unSortedMsgs.length) {
					const sortedMsg = state.unSortedMsgs.filter(msg => {
						return userId ? (msg.senderID == userId && msg.timestamp < timestamp) : (msg.timestamp < timestamp)
					})
					if (sortedMsg.length) {
						commit('updateUnSortedMsgs', { action: 'del', sortedMsgIDs: sortedMsg.map(msg => {
							return msg.id
						}) })
					}
				}
				commit('clearMsg', { userId, exclude, timestamp })
			}

			// 如果包含文件，删除本地文件
			if (files.length > 0) {
				for (let i = 0; i < files.length; i++) {
					fun.deleteFile(files[i].data.localPath)
					if (files[i].data.localPath_preView) fun.deleteFile(files[i].data.localPath_preView)
				}
			}

			resolve(res)
		}).catch(e => {
			reject(e)
		})
	})
}
export const abortDownload = async({ dispatch, state, commit }, { messageId, threadId, senderId }) => {
	const ids = []
	console.log('abortDownload:::', messageId, threadId, senderId)
	if (messageId) { // 单条撤回
		ids.push(`${messageId}|${threadId}|${senderId}`)
	} else if (!messageId && threadId && senderId) { // 会话里撤回所有
		for (let i = 0; i < state.downloadingMsgs.length; i++) {
			if (state.downloadingMsgs[i].indexOf(`|${threadId}|${senderId}`) > -1) {
				ids.push(state.downloadingMsgs[i])
			}
		}
	} else if (!messageId && threadId && !senderId) { // 会话里双向撤回
		for (let i = 0; i < state.downloadingMsgs.length; i++) {
			if (state.downloadingMsgs[i].indexOf(`|${threadId}|`) > -1) {
				ids.push(state.downloadingMsgs[i])
			}
		}
	} else if (!messageId && !threadId && senderId) { // 销号
		for (let i = 0; i < state.downloadingMsgs.length; i++) {
			if (state.downloadingMsgs[i].indexOf(`|${senderId}`) > -1) {
				ids.push(state.downloadingMsgs[i])
			}
		}
	}
	if (ids.length) {
		for (let i = 0; i < ids.length; i++) {
			commit('updateDownloadingMsgs', {
				action: 'del',
				id: ids[i]
			})
			fun.abortDownloadFile(ids[i].split('|')[0])
		}
	}
}
/* 处理撤回消息后图片队列、发送队列、浏览器控制等 */
export const progressQueue = async({ dispatch }, { messageId, threadId, senderId, timestamp }) => {
	// console.log('progressQueue:::', messageId, threadId, senderId, timestamp)
	// setImagePlayerArray是图片浏览队列
	// sendFileQueue 文件发送队列
	if (messageId === 'all') {
		dispatch('setImagePlayerArray', { action: 'clear', timestamp, data: { senderId }})
		dispatch('abortDownload', { messageId: '', threadId, senderId })
		await dispatch('setSendFileQueue', { action: 'clear', data: { threadID: threadId }})
	} else {
		dispatch('setImagePlayerArray', { action: 'del', targetId: messageId })
		dispatch('abortDownload', { messageId, threadId, senderId })
		await dispatch('setSendFileQueue', { action: 'del', data: { msgID: messageId, threadID: threadId }})
	}
	fun.closePlayerWin({ messageId, threadId, senderId })
	return Promise.resolve()
}
/* 删除消息 */
export const delMsg = ({ state, getters, commit, dispatch, rootState }, { threadID, ids, deleteDatabaseOnly, deleteBothSide }) => {
	return new Promise(async(resolve, reject) => {
		const thread = getters.someThread(threadID)
		const lastMessageID = thread.lastMessageID

		let updatingThreadData
		let lastMessage
		// 数据库id字段为字符串，得加上''
		const idsStr = ids.join(',').replace(/,/g, "','")
		if (ids.includes(lastMessageID)) {
			const newLastMsg = (await sqlite.getChatData({
				where: `threadID='${threadID}' and id not in ('${idsStr}')`,
				order: 'timestamp DESC',
				size: 1
			}))[0]

			updatingThreadData = {
				id: threadID,
				lastMessageID: newLastMsg ? newLastMsg.id : '',
				lastMessageTimestamp: newLastMsg ? newLastMsg.timestamp : ''
			}
			lastMessage = newLastMsg || null
		}

		const deletingMessages = await sqlite.getChatData({
			where: `id in ('${idsStr}') or originID in ('${idsStr}')`
		})
		// 如果包含文件，删除本地文件
		const files = deletingMessages.filter(msg => {
			return msg.cForm == CHAT_MSG_TYPE.TYPE_IMAGE || msg.cForm == CHAT_MSG_TYPE.TYPE_VOICE || msg.cForm == CHAT_MSG_TYPE.TYPE_VIDEO || msg.cForm == CHAT_MSG_TYPE.TYPE_FILE
		})

		// 如果包含回复文件的消息，更新图片队列
		const replyFiles = deletingMessages.filter(msg => {
			return msg.replyInfo && msg.replyInfo.form == CHAT_MSG_TYPE.TYPE_IMAGE
		})

		// 如果包含聊天记录，删除相关子消息
		const childMsgs = deletingMessages.filter(msg => {
			return msg.cForm == CHAT_MSG_TYPE.TYPE_CHATRECORD
		})

		sqlite.deleteChatData({
			where: `id in ('${idsStr}') or originID in ('${idsStr}')`,
			updatingThreadData
		}).then(async res => {
			// 如果包含文件，删除本地文件
			if (files.length > 0) {
				for (let i = 0; i < files.length; i++) {
					if (files[i].cForm !== CHAT_MSG_TYPE.TYPE_FILE) { // 文件不能删
						await fun.deleteFile(files[i].data.localPath)
						if (files[i].data.localPath_preView) await fun.deleteFile(files[i].data.localPath_preView)
					}
					await dispatch('progressQueue', { messageId: files[i].id, threadId: files[i].threadID })
				}
			}

			// 如果包含回复文件的消息，更新图片队列
			if (replyFiles.length > 0) {
				replyFiles.forEach(async reply => {
					await dispatch('progressQueue', { messageId: reply.id, threadId: reply.threadID })
				})
			}

			console.log('updatingThreadData', updatingThreadData)

			if (!deleteDatabaseOnly) commit('delMsg', ids)
			if (updatingThreadData) {
				updatingThreadData.lastMessage = lastMessage
				commit('updateThread', { threadID, updatingData: updatingThreadData })
			}

			ids.forEach(id => {
				const targetMessage = deletingMessages.find(msg => {
					return msg.id == id
				})
				if (targetMessage && targetMessage.status == 1) {
					chatSdk.cDeleteAsync(`${id}`, '', ((!!deleteBothSide === true) ? 'true' : 'false'))
				}
			})

			// 删除聊天记录的子消息
			if (childMsgs.length > 0) {
				for (let i = 0; i < childMsgs.length; i++) {
					await sqlite.deleteChatData({
						where: `threadID like '${childMsgs[i].id}%'`
					})
				}
			}

			resolve(res)
		}).catch(e => {
			reject(e)
		})
	})
}

/* 双向撤回 */
export const withdraw = ({ rootGetters, rootState, state, commit, dispatch, getters }, { groupId, messageId, action, isGroupOwner = 0, messageTimestamp, messageUserId }) => {
	return new Promise(async(resolve, reject) => {
		const myInfo = rootState.User.accountInfo
		const meta = JSON.stringify({
			form: 55,
			organId: myInfo.organId || '',
			userId: myInfo.userId,
			userName: myInfo.nickName,
			messageId,
			messageTimestamp,
			messageUserId,
			action,
			isSecretChat: 0,
			isGroupOwner,
			clientType: process.env.webConfig.client_type,
			groupId
		})

		const res = messageId ? (await chatSdk.cDeleteAsync(`${messageId}`, meta, 'true'))
			: (await chatSdk.cCleanAsync(`${groupId}`, meta))

		if (res.code === 0) {
			if (messageId) {
				await dispatch('progressQueue', { messageId, threadId: groupId })

				// 如果消息发送时间距今小于2分钟，则将该消息的基本信息保存到data，用于重新编辑
				const msgData = {}
				const targetMessage = getters.someMessage(messageId)
				if (targetMessage.isSend == 1 && [CHAT_MSG_TYPE.TYPE_TEXT, CHAT_MSG_TYPE.TYPE_REPLY].indexOf(targetMessage.cForm) >= 0) {
					const pastTime = Math.floor((fun.getServerTime('withdraw') - targetMessage.timestamp) / 60000)
					if (pastTime <= 2) {
						msgData.editable = true
					}
				}

				await dispatch('updateMsg', {
					id: messageId,
					updatingData: {
						text: `${window.i18n.t('chat.withdrewMessages[0]', { name: targetMessage.isSend ? window.i18n.t('common.you') : window.i18n.t('chat.ownerAndAdmin') })}`,
						// senderID: targetMessage.isSend ? targetMessage.senderID : '',
						senderID: rootState.User.accountInfo.userId,
						mType: 'tip_withdraw',
						data: msgData,
						cForm: 53
					}
				})
			} else {
				if (action == 1) { // 单聊
					await dispatch('clearMsg', { threadID: groupId })
				} else { // 群聊
					if (isGroupOwner) {
						await dispatch('clearMsg', { threadID: groupId })
					} else {
						await dispatch('clearMsg', {
							threadID: groupId,
							userId: rootState.User.accountInfo.userId,
							exclude: "(cForm!=53 or mType in ('tip_withdraw','tip_withdrawAll'))"
						})
					}
				}
				await dispatch('addTip', {
					threadID: groupId,
					text: window.i18n.t('chat.withdrewMessages[1]', { name: window.i18n.t('common.you') }),
					mType: 'tip_withdrawAll',
					timestamp: fun.getServerTime('chat.withdrewMessages[1]'),
					senderID: rootState.User.accountInfo.userId,
					threadType: action == 1 ? 0 : 1
				})
			}
		}

		resolve(res)
	})
}

/* 添加提示消息 */
export const addTip = ({ state, dispatch, rootState }, message) => {
	return new Promise(async(resolve, reject) => {
		const { id, timestamp, mType, senderID, threadType = 1, status = 1 } = message
		window._.assign(message, {
			id: `${id || timestamp}`,
			threadType,
			cForm: 53,
			mType: mType || '',
			status,
			read: 1,
			isSend: senderID == rootState.User.accountInfo.userId ? 1 : 0,
			senderID: senderID || ''
		})
		const res = await dispatch('receiveMessage', { message })
		resolve(res)
	})
}

/* --------------群设置相关--------------*/

/* 删除群成员 */
export const removeMember = ({ commit }, { userId, groupId }) => {
	return new Promise((resolve, reject) => {
		user.deleteGroupUsers({ userIds: [userId], groupId }).get().then(res => {
			resolve(res)
		}).catch(e => {
			resolve(e)
		})
	})
}

/* 转移群主 */
export const transferOwner = ({ commit }, data) => {
	return new Promise((resolve, reject) => {
		user.updateGroupOwner(data).get().then(res => {
			resolve(res)
		}).catch(e => {
			resolve(e)
		})
	})
}

/* 退出|解散群聊 */
export const killThread = ({ rootState, state, commit, getters }, { groupId, killLocalOnly }) => {
	return new Promise(async(resolve, reject) => {
		// 如果没有会话记录，则不处理
		const targetThread = getters.someThread(groupId)
		if (!targetThread) {
			return resolve()
		}

		// 如果是群聊，则退出群聊
		if (targetThread.type == 1 && !killLocalOnly) {
			const res = await leaveGroup(groupId)
			if (res && res.code != 0) {
				return resolve(res)
			}
		}

		if (state.currentThreadID == groupId) { // 如果为当前会话，跳转到空会话
			commit('switchThread', null)
			// if (/chat\//.test(rootState.route.path)) {
			// 	commit('route/ROUTE_CHANGED', { to: { path: '/chat', fullPath: '/chat', params: { id: '' }}}, { root: true })
			// }
		}

		// 删除会话数据
		commit('killThread', groupId)
		sqlite.deleteThreadData({ threadID: `='${groupId}'` })

		resolve({ code: 0 })
	})
}

/* 获取用户名字，好友备注>群昵称>昵称 */
export const getUserName = ({ rootState, rootGetters }, { userId, threadID, defaultName }) => {
	let userInfo = rootGetters['MyFriend/friendInfo'](userId)// 从好友列表获取该用户信息
	if (JSON.stringify(userInfo) == '{}' || !userInfo.label) { // 该用户非好友或没有设置备注
		if (threadID) { // 群聊
			userInfo = rootGetters['MyGrounp/groupUserInfo'](threadID, userId)// 从群成员列表获取该用户信息
			if (userInfo && !userInfo.userLabel) { // 没有群昵称
				userInfo = rootGetters['User/userInfo'](userId)// 从用户表获取该用户信息
			}
		} else { // 单聊
			userInfo = rootGetters['User/userInfo'](userId)// 从用户表获取该用户信息
		}
	}

	if (userInfo) {
		return Promise.resolve(userInfo.label || userInfo.userLabel || userInfo.nickName || defaultName)
	} else { // 如果用户不存在，返回默认
		return Promise.resolve(defaultName)
	}
}

/* 群变更推送处理 */
export const threadChange = ({ rootState, rootGetters, getters, state, commit, dispatch }, data) => {
	return new Promise(async(resolve, reject) => {
		console.log(data)

		const myId = rootState.User.accountInfo.userId
		const threadID = data.groupId

		if (!data.isHistory && [0, 1, 2, 3, 5, 6, 7, 19, 20].includes(data.action)) {
			await dispatch('preUpdateThread', { threadID })
		}

		const timestamp = data.timestamp
		const timeStr = data.timeStr
		const syncBatch = data.syncBatch || ''
		const id = data.id || ''

		let operatorUser
		let operatorUserName
		let tip = ''

		let ids
		let names
		let targetUserLabel = ''
		let existThread

		switch (data.action) {
			case 0:// 群名称修改
				if (data.operatorUserId == myId) {
					operatorUserName = window.i18n.t('common.you')
				} else {
					operatorUserName = await dispatch('getUserName', {
						userId: data.operatorUserId,
						threadID,
						defaultName: data.operatorUserName
					})
				}
				await dispatch('addTip', {
					id,
					threadID,
					threadType: 1,
					senderID: data.operatorUserId,
					mType: 'tip_editGroupName',
					text: window.i18n.t('chat.changeGroupName', { userName: operatorUserName, groupName: data.groupName }),
					timestamp,
					timeStr,
					syncBatch
				})
				break
			case 1:// 有人加入
				if (data.inviterUserId == myId) {
					operatorUserName = window.i18n.t('common.you')
				} else {
					operatorUserName = await dispatch('getUserName', {
						userId: data.inviterUserId || data.userId,
						threadID,
						defaultName: data.inviterUserName || data.userName
					})
				}

				ids = `${data.userId}`.split('|')
				names = `${data.userName}`.split('|')

				ids.forEach((id, index) => {
					if (id == myId) {
						names[index] = window.i18n.t('common.you')
						existThread = getters.someThread(threadID)
						if (existThread && existThread.latestStatus == '9') {
							commit('updateThread', { threadID, updatingData: { latestStatus: '8' }})
						}
					} else {
						targetUserLabel = rootGetters['MyFriend/friendInfo'](id).label
						if (targetUserLabel) {
							names[index] = targetUserLabel
						}
					}
				})

				tip = !data.inviterUserName ? window.i18n.t('chat.inviteGroupChat[1]', { name: operatorUserName }) : window.i18n.t('chat.inviteGroupChat[0]', { op: operatorUserName, userNames: names.join('、') })

				await dispatch('addTip', {
					id,
					threadID,
					threadType: 1,
					senderID: data.inviterUserId,
					mType: 'tip_joinGroup',
					text: tip,
					timestamp,
					timeStr,
					syncBatch
				})
				break
			case 2:// 有人退群
				if (data.operatorUserId == myId) { // 如果是自己操作
					targetUserLabel = await dispatch('getUserName', {
						userId: data.userId,
						threadID,
						defaultName: data.userName
					})
					tip = window.i18n.t('chat.removeGroupChat[1]', { name: targetUserLabel })
				} else if (data.operatorUserId != data.userId) {
					const myInfo = rootGetters['MyGrounp/groupUserInfo'](threadID, myId)
					if (myInfo.adminFlag != 0) { // 只有群主或管理员才显示
						targetUserLabel = await dispatch('getUserName', {
							userId: data.userId,
							threadID,
							defaultName: data.userName
						})
						operatorUserName = await dispatch('getUserName', {
							userId: data.operatorUserId,
							threadID,
							defaultName: data.operatorUserName
						})
						tip = window.i18n.t('chat.removeGroupChat[2]', { op: operatorUserName, name: targetUserLabel })
					}
				}

				if (tip) {
					await dispatch('addTip', {
						id,
						threadID,
						threadType: 1,
						senderID: data.operatorUserId,
						mType: 'tip_leaveGroup',
						text: tip,
						timestamp,
						timeStr,
						syncBatch
					})
				}
				break
			case 3:// 你加入了群
				if (data.inviterUserId) { // 如果是被邀请
					operatorUser = rootGetters['MyFriend/friendInfo'](data.inviterUserId)
					// 将被邀请人中的我的昵称改为‘你’
					names = data.userName.split('|')
					ids = data.userId.split('|')
					const myIndex = window._.indexOf(ids, `${myId}`)
					if (myIndex >= 0) {
						names[myIndex] = window.i18n.t('common.you')
					}
					// tip = `${operatorUser.label || operatorUser.nickName || data.inviterUserName} 邀请 ${names.join('、')} 加入群聊`
					tip = window.i18n.t('chat.inviteGroupChat[0]', { op: operatorUser.label || operatorUser.nickName || data.inviterUserName, userNames: names.join('、') })
				} else { // 扫码
					// tip = '你 通过二维码加入群聊'
					tip = window.i18n.t('chat.inviteGroupChat[1]', { name: window.i18n.t('common.you') })
				}

				await dispatch('addTip', {
					id,
					threadID,
					threadType: 1,
					senderID: data.inviterUserId || rootState.User.accountInfo.userId,
					mType: 'tip_joinGroup',
					text: tip,
					timestamp,
					timeStr,
					syncBatch
				})
				break
			case 4:// 你退出群
				existThread = getters.someThread(threadID)// 是否存在会话
				if (data.operatorUserId == myId) {
					if (!existThread) return resolve()
					// 如果退群时间小于最后一条消息时间，则不处理
					if (existThread.lastMessageTimestamp && existThread.lastMessageTimestamp > timestamp) {
						// 清空退群时间之前的消息
						await dispatch('clearMsg', { threadID, timestamp })
						return resolve()
					}
					await dispatch('killThread', { groupId: threadID, killLocalOnly: true })
					return resolve()
				}

				const existGroup = rootState.MyGrounp.list.some(group => { // 是否存在群聊
					return group.groupId == threadID
				})
				if (existThread) {
					if (!existGroup) { // 如果真退群了
						const updatingThreadData = {
							id: threadID,
							latestStatus: '9'
						}
						await sqlite.deleteChatData({
							where: `threadID='${threadID}' and timestamp<${timestamp}`,
							updatingThreadData
						})
						commit('updateThread', { threadID, updatingData: updatingThreadData })
					} else { // 如果又被加回了群，清空退群前的所有消息
						await sqlite.deleteChatData({
							where: `threadID='${threadID}' and timestamp<${timestamp}`
						})
					}
				}

				if (existThread || existGroup) {
					await dispatch('addTip', {
						id,
						threadID,
						threadType: 1,
						senderID: data.operatorUserId,
						mType: 'tip_leaveGroup',
						text: window.i18n.t('chat.removeGroupChat[0]'),
						timestamp,
						timeStr,
						syncBatch
					})
				}
				break
			case 5:// 群主变更
				if (data.userId == myId) {
					operatorUserName = await dispatch('getUserName', {
						userId: data.operatorUserId,
						threadID,
						defaultName: data.operatorUserName
					})

					await dispatch('addTip', {
						id,
						threadID,
						threadType: 1,
						senderID: data.operatorUserId,
						mType: 'tip_transferOwner',
						text: window.i18n.t('chat.transferOwner', { name: operatorUserName }),
						timestamp,
						timeStr,
						syncBatch
					})
				}
				break
			case 6:// 开启匿名模式
				await dispatch('addTip', {
					id,
					threadID,
					threadType: 1,
					senderID: data.operatorUserId,
					mType: 'tip_switchAnonym',
					text: window.i18n.t('chat.openCloseAnonymousChat[1]'),
					timestamp,
					timeStr,
					syncBatch
				})
				break
			case 7: // 关闭匿名模式
				await dispatch('addTip', {
					id,
					threadID,
					threadType: 1,
					senderID: data.operatorUserId,
					mType: 'tip_switchAnonym',
					text: window.i18n.t('chat.openCloseAnonymousChat[0]'),
					timestamp,
					timeStr,
					syncBatch
				})
				break
			case 8:// 群用户设置变更(不允许其他成员添加我,显示名称)
				break
			case 9:// 群解散
				existThread = getters.someThread(threadID)
				if (data.operatorUserId == myId) {
					if (!existThread) return resolve()
					await dispatch('killThread', { groupId: threadID, killLocalOnly: true })
					return resolve()
				} else if (existThread) {
					const updatingThreadData = {
						id: threadID,
						lastMessageID: '',
						lastMessage: null,
						lastMessageTimestamp: '',
						latestStatus: '6',
						state: 1
					}
					await sqlite.deleteChatData({
						where: `threadID='${threadID}' and timestamp<${timestamp}`,
						updatingThreadData
					})
					commit('updateThread', { threadID, updatingData: updatingThreadData })
				}
				await dispatch('addTip', {
					id,
					threadID,
					threadType: 1,
					senderID: data.operatorUserId,
					mType: 'tip_killThread',
					text: window.i18n.t('chat.groupDisbanded[0]'),
					timestamp,
					timeStr,
					syncBatch
				})
				break
			case 10:// 申请进群(userId多个用竖线分隔)

				break
			case 12:// 添加管理员
			case 13:// 删除管理员
				ids = `${data.userId}`.split('|')
				if (ids.length > 0) {
					names = `${data.userName}`.split('|')
					ids.forEach((id, index) => {
						if (id == myId) {
							names[index] = window.i18n.t('common.you')
						} else {
							targetUserLabel = rootGetters['MyFriend/friendInfo'](id).label
							if (targetUserLabel) {
								names[index] = targetUserLabel
							}
						}
					})
				}
				names = names.join('、')
				if (data.operatorUserId == myId) {
					// tip = data.action == 12 ? `你已将 ${names} 设置为该群管理员` : `你已将 ${names} 从群管理员中移除`
					tip = data.action == 12 ? window.i18n.t('chat.setGroupAdmin1[0]', { name: names }) : window.i18n.t('chat.setGroupAdmin1[1]', { name: names })
				} else if (ids.length == 1 && ids == myId) {
					tip = data.action == 12 ? window.i18n.t('chat.setGroupAdmin1[2]') : window.i18n.t('chat.setGroupAdmin1[3]')
				} else {
					operatorUserName = await dispatch('getUserName', {
						userId: data.operatorUserId,
						threadID,
						defaultName: data.operatorUserName
					})
					// tip = data.action == 12 ? `${operatorUserName} 已将 ${names} 添加为群管理员` : `${operatorUserName} 已将 ${names} 从群管理员中移除`
					tip = data.action == 12 ? window.i18n.t('chat.setGroupAdmin2[0]', { op: operatorUserName, name: names }) : window.i18n.t('chat.setGroupAdmin2[1]', { op: operatorUserName, name: names })
				}

				await dispatch('addTip', {
					id,
					threadID,
					threadType: 1,
					senderID: data.operatorUserId,
					mType: data.action == 12 ? 'tip_addGroupManager' : 'tip_removeGroupManager',
					text: tip,
					timestamp,
					timeStr,
					syncBatch
				})
				break
			case 18: // 拒绝加入群聊
				ids = `${data.userId}`.split('|')
				if (ids.length === 0) return resolve()

				names = []
				let friendInfo
				let userInfo
				let userName

				ids.forEach((id, index) => {
					friendInfo = rootGetters['MyFriend/friendInfo'](id)
					if (friendInfo.label) {
						userName = friendInfo.label
						names.push(userName)
					} else {
						userInfo = rootGetters['User/userInfo'](id)
						if (userInfo) {
							names.push(userInfo.userLabel || userInfo.nickName)
						}
					}
				})

				await dispatch('addTip', {
					id,
					threadID,
					threadType: 1,
					senderID: data.operatorUserId,
					mType: 'tip_refuseJoinGroup',
					text: window.i18n.t('chat.refusedToJoinGroupChat', { name: names.join('、') }),
					timestamp,
					timeStr,
					syncBatch
				})
				break
				case 19: // 群成员保护模式
				await dispatch('addTip', {
					id,
					threadID,
					threadType: 1,
					senderID: data.operatorUserId,
					mType: 'tip_privacyProtection',
					text: window.i18n.t('chat.hujiahaoyouxianzhi[0]'),
					timestamp,
					timeStr,
					syncBatch
				})
				break
				case 20: // 群成员保护模式
				await dispatch('addTip', {
					id,
					threadID,
					threadType: 1,
					senderID: data.operatorUserId,
					mType: 'tip_privacyProtection',
					text: window.i18n.t('chat.hujiahaoyouxianzhi[1]'),
					timestamp,
					timeStr,
					syncBatch
				})
				break
		}
		resolve()
	})
}

export const preUpdateThread = ({ state, rootGetters, getters, commit }, { threadID = '', userId }) => {
	// 更新会话
	let groupInfo
	if (userId) {
		const friendInfo = rootGetters['MyFriend/friendInfo'](userId)
		if (!friendInfo || !friendInfo.userId) {
			return
		}
		const userInfo = rootGetters['User/userInfo'](userId)
		const { nickName, userAvatar, workingStatusId, workingStatusValue, workingStatusExpression } = userInfo
		const { label, notDisturb, burntAfterRead, groupId } = friendInfo
		threadID = groupId

		groupInfo = {
			groupName: label || nickName,
			groupAvatar: userAvatar,
			workingStatusId,
			workingStatusValue,
			workingStatusExpression,
			burntAfterRead,
			notDisturb,
			userId,
			groupId
		}
	} else {
		groupInfo = window._.cloneDeep(
			rootGetters['MyGrounp/groupInfo'](threadID)
		)
	}

	const baseInfo = getters.someThread(threadID)
	if (!groupInfo || !groupInfo.groupId || !baseInfo || !baseInfo.id) {
		return
	}

	const {
		groupName: name,
		groupAvatar: avatar,
		...setup
	} = groupInfo

	// 如果群头像昵称有变动，则更新数据库
	const updatingData = {}
	if (name && baseInfo.name != name)updatingData.name = name
	if (avatar && baseInfo.avatar != avatar)updatingData.avatar = avatar
	if (groupInfo.memberNum !== undefined && baseInfo.memberNum != groupInfo.memberNum)updatingData.memberNum = groupInfo.memberNum
	if (groupInfo.notDisturb !== undefined && baseInfo.notDisturb != groupInfo.notDisturb)updatingData.notDisturb = groupInfo.notDisturb

	if (Object.keys(updatingData).length > 0) {
		sqlite.updateThreadData(updatingData, `id='${threadID}'`)
	}

	let oldVal
	let newVal
	for (const key in setup) {
		oldVal = baseInfo[key]
		newVal = setup[key]
		if (newVal !== undefined && oldVal != newVal) {
			updatingData[key] = newVal
		}
	}

	console.log('更新会话数据：', updatingData)
	commit('updateThread', { threadID, updatingData })
}

// 获取系统消息
export const getNotify = ({ rootState, dispatch }) => {
	return new Promise(async(resolve, reject) => {
		// 获并更新取免打扰状态
		try {
			const userDetail = await user.detail().get()
			if (userDetail.code == 0 && userDetail.data) {
				await dispatch('updateThread', {
					threadID: 'notify',
					updatingData: {
						notDisturb: userDetail.data.sysMsgNotDisturb
					}
				})
			}

			const lastNotify = (await sqlite.getChatData({
				where: "threadID='notify'",
				order: 'timestamp Desc'
			}))[0]

			const res = await msgApi.getNotify({ data: { time: lastNotify ? lastNotify.data.createTime : '' }}).get()
			console.log('系统公告：', lastNotify ? lastNotify.data.createTime : '', res)
			if (res.code == 0 && res.data.length > 0) {
				const notifies = res.data

				const existNotify = (await sqlite.getChatData({
					where: `id=${notifies[0].id}`
				})).length > 0

				if (existNotify) return resolve()

				// 如果被移出过企业，则不再显示欢迎消息
				let hasBeenRemoved = false
				const organRemoveTime = rootState.User.accountInfo.organRemoveTime
				if (organRemoveTime && organRemoveTime.length > 0) {
					hasBeenRemoved = true
				}

				let message
				let notify
				for (let i = 0; i < notifies.length; i++) {
					notify = notifies[i]
					// 被移出过企业，不再显示欢迎消息
					if (notify.id == 11 && (notify.readState == 1 || hasBeenRemoved)) {
						continue
					}
					message = {
						id: notify.id,
						threadID: 'notify',
						threadType: 10001,
						senderID: 'system',
						status: 1,
						timestamp: new Date(notify.createTime).getTime(),
						cForm: process.env.webConfig.CHAT_MSG_TYPE.TYPE_TEXT,
						text: notify.noticeContent,
						data: notify,
						read: notify.readState
					}
					await dispatch('receiveMessage', { message })
				}
			}
			resolve()
		} catch (e) {
			reject(e)
		}
	})
}

// 获取积分收支信息
export const getPointNotify = ({ rootState, dispatch }) => {
	return new Promise(async(resolve, reject) => {
		const lastNotify = (await sqlite.getChatData({
			where: "threadID='point'",
			order: 'timestamp Desc'
		}))[0]

		msgApi.getPointNotify({ data: { id: lastNotify ? lastNotify.id : 0 }}).get().then(async res => {
			console.log('积分助手：', res)
			if (res.code == 0 && res.data.length > 0) {
				const notifies = res.data

				const existNotify = (await sqlite.getChatData({
					where: `id=${notifies[0].id}`
				})).length > 0

				if (existNotify) return resolve()

				let message
				let notify
				const texts = {
					0: window.i18n.t('point.adminAssistant'),
					1: window.i18n.t('point.adminRecycle'),
					2: window.i18n.t('point.expiredAndReturned')
				}
				for (let i = 0; i < notifies.length; i++) {
					notify = notifies[i]
					notify.uiText = getPointCardUiText(notify.type)

					message = {
						id: notify.id,
						threadID: 'point',
						threadType: 10001,
						senderID: 'system',
						status: 1,
						timestamp: new Date(notify.createTime).getTime(),
						cForm: process.env.webConfig.CHAT_MSG_TYPE.TYPE_TEXT,
						text: texts[notify.type],
						data: notify,
						read: notify.readFlag
					}
					await dispatch('receiveMessage', { message })
				}
			}
			resolve()
		}).catch(e => {
			reject(e)
		})
	})
}

/* --------------封装的方法--------------*/

function getPointCardUiText(type) {
	let uiText
	switch (type) {
	case 0:
		uiText = {
			title: window.i18n.t('point.adminAssistant'),
			subTitle: window.i18n.t('point.rechargePoints'),
			time: window.i18n.t('point.arrivalTime'),
			remark: window.i18n.t('point.alias')
		}
		break
	case 1:
		uiText = {
			title: window.i18n.t('point.adminRecycle'),
			subTitle: window.i18n.t('point.recyclePoints'),
			time: window.i18n.t('point.recycleTime'),
			remark: window.i18n.t('point.alias')
		}
		break
	case 2:
		uiText = {
			title: window.i18n.t('point.expiredAndReturned'),
			subTitle: window.i18n.t('point.returnPoints'),
			time: window.i18n.t('point.arrivalTime'),
			remark: window.i18n.t('point.alias')
		}
		break
	}
	return uiText
}

/* 获取会话状态 */
function getThreadStatus(data) {
	return new Promise((resolve, reject) => {
		if (data.groupId == 'notify') {
			resolve('')
		}
		let status = ''
		user.verifyFriendRelation(data).get().then(res => {
			if (res.code == 0 && res.data && res.data.status) {
				status = res.data.status
			}

			resolve(status)
		}).catch(e => {
			resolve(status)
		})
	})
}

/* 离开聊天 */
function leaveGroup(groupId) {
	return new Promise((resolve, reject) => {
		user.leaveGroup({ groupId }).get().then(res => {
			resolve(res)
		}).catch(e => {
			resolve(e)
		})
	})
}

