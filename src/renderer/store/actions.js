const { user } = require('@/utils/electron/api')

// 更新会话设置
export const updateThreadSetup = ({ state, getters, dispatch, commit }, { type, updatingData }) => {
	return new Promise(async(resolve, reject) => {
		const thread = getters['Chat/someThread'](updatingData.groupId)
		if (thread.type == 1) {
			if (type === 'send') { // 请求更新接口
				const res = await updateGroupThreadInfo(updatingData)
				if (res.code != 0) {
					return resolve(res)
				}
			}

			// if (updatingData.groupName !== undefined) {
			// 	const getGroupInfo = await getGroupThreadInfo(updatingData.groupId)
			// 	updatingData.groupName = getGroupInfo.data.groupName
			// }
			// // 更新VueX
			// await dispatch('MyGrounp/update_info', updatingData)

			// // 如果更新包含用户群昵称
			// if (updatingData.userLabel !== undefined) {
			// 	await dispatch('MyGrounp/update_userRelation', updatingData)
			// }

			// // 如果更新包含开关匿名
			// if (updatingData.isAnoymous !== undefined) {
			// 	await dispatch('MyGrounp/update_userRelation', {
			// 		groupId: updatingData.groupId
			// 	})
			// 	await dispatch('MyFriend/update_info', updatingData)
			// }

			// // 如果更新是否允许添加我
			// if (updatingData.notAllowAddme !== undefined) {
			// 	await dispatch('MyGrounp/update_userRelation', {
			// 		groupId: updatingData.groupId
			// 	})
			// 	await dispatch('MyFriend/update_info', updatingData)
			// }
		} else if (thread.type == 0) {
			if (type === 'send') { // 请求更新接口
				const res = await updatePrivateThreadInfo(updatingData)
				if (res.code != 0) {
					return resolve(res)
				}
			}
			// await dispatch('MyFriend/update_info', updatingData)
		}
		resolve({ code: 0 })
	})
}

// 更新群聊设置
function updateGroupThreadInfo(data) {
	return new Promise((resolve, reject) => {
		user.updateGroupSettings(data).get().then(res => {
			resolve(res)
		}).catch(e => {
			resolve(e)
		})
	})
}

// 获取群聊设置
// function getGroupThreadInfo(data) {
// 	return new Promise((resolve, reject) => {
// 		user.getGroupSettings({ groupId: data }).get().then(res => {
// 			resolve(res)
// 		}).catch(e => {
// 			resolve(e)
// 		})
// 	})
// }

// 更新单聊设置
function updatePrivateThreadInfo(data) {
	return new Promise((resolve, reject) => {
		const { userId, ...rest } = data
		rest.friendUserId = userId

		user.updateFriendState(rest).get().then(res => {
			resolve(res)
		}).catch(e => {
			resolve(e)
		})
	})
}
