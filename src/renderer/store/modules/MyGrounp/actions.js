const { user } = require('@/utils/electron/api')

// 设置群组列表数据---set_list([...]/null)
export const set_list = ({ rootState, state, commit }, paylod) => {
	return new Promise((resolve, reject) => {
		if (paylod) {
			commit('setList', paylod)
			resolve(paylod)
		} else {
			user.getGroupList().get().then(res => {
				commit('setList', res.data.list || [])
				resolve(res.data.list)
			}).catch(e => {
				reject(e)
			})
		}
	})
}

// 刷新群配置
export const refreshSettings = ({ rootState, state, commit }, groupId) => {
	return new Promise((resolve, reject) => {
		user.getGroupSettings({ groupId, custError: true }).get().then(res => {
			if (res.code == 0) {
				commit('updateGroupInfo', { paylod: getNeededGroupInfo(res.data) })
				let list = rootState.MyGrounp.userRelationList.filter(userRelation => userRelation.groupId != groupId)
				list = list.concat(res.data.groupUsers)
				commit('setUserRelationList', list)
				resolve({ code: 0 })
			} else {
				reject(res)
			}
		}).catch(e => {
			reject(e)
		})
	})
}

// 更新群组信息(添加/更新)---update_info({groupId:123, reload: true/false})
export const update_info = ({ rootState, state, commit }, paylod = {}) => {
	return new Promise((resolve, reject) => {
		const index = rootState.MyGrounp.list.findIndex(item => {
			return item.groupId == paylod.groupId
		})
		if (index != -1 && !paylod.reload) {
			commit('updateGroupInfo', { paylod, index })
			resolve()
		} else {
			user.getGroupDetail({ groupId: paylod.groupId }).get().then(res => {
				if (res.code == 0 && res.data) {
					commit('updateGroupInfo', { paylod:	getNeededGroupInfo(res.data), index })
					resolve()
				} else {
					reject(res)
				}
			}).catch(e => {
				reject(e)
			})
		}
	})
}

// 删除群组信息---delete_info({groupId:123})
export const delete_info = ({ rootState, state, commit }, paylod) => {
	return new Promise((resolve, reject) => {
		const newList = rootState.MyGrounp.list.filter(item => item.groupId != paylod.groupId)
		commit('setList', newList)
		resolve(newList)
	})
}

//  设置群组关系列表---set_userRelationList([...]/null)
export const set_userRelationList = ({ rootState, state, commit }, paylod) => {
	return new Promise((resolve, reject) => {
		if (paylod) {
			commit('setUserRelationList', paylod)
			resolve(paylod)
		} else {
			user.myAllGroupUserList().get().then(res => {
				commit('setUserRelationList', res.data || [])
				resolve(res.data)
			}).catch(e => {
				reject(e)
			})
		}
	})
}

// 更新群组关系列表(添加/更新)---update_userRelation({groupId: 123})
export const update_userRelation = ({ rootState, state, commit }, paylod = {}) => {
	return new Promise((resolve, reject) => { //  无userId查询群内所有成员
		user.getGroupUserList({ groupId: paylod.groupId, userId: paylod.userId }).get().then(res => {
			let userRelationList = []
			if (paylod.userId) {
				// userRelationList = rootState.MyGrounp.userRelationList.map(item => {
				// 	const info = (item.groupId == paylod.groupId && item.userId == paylod.userId) ? res.data.list[0] : item
				// 	return info
				// })
				const	index = rootState.MyGrounp.userRelationList.findIndex(item => {
					return (item.groupId == paylod.groupId && item.userId == paylod.userId)
				})
				commit('updateUserRelationInfo', { paylod:	res.data.list[0], index	})
				resolve()
			} else {
				const list = rootState.MyGrounp.userRelationList.filter(userRelation => userRelation.groupId != paylod.groupId)
				userRelationList = res.data.list.concat(list)
				commit('setUserRelationList', userRelationList)
				resolve()
			}
		}).catch(e => {
			reject(e)
		})
	})
}

// 删除某群组关系列表---delete_userRelation({groupId: 123})
export const delete_userRelation = ({ rootState, state, commit }, paylod) => {
	return new Promise((resolve, reject) => {
		const userRelationList = rootState.MyGrounp.userRelationList.filter(userRelation => userRelation.groupId != paylod.groupId)
		commit('setUserRelationList', userRelationList)
		resolve(userRelationList)
	})
}

// 防止服务端跟本地数据库字段名重复，只取需要的
function getNeededGroupInfo(originData) {
	const {
		bannedSpeech,
		groupOwnerId,
		viewHistory,
		forbidMemberJoin,
		temporaryFlag,
		groupAvatar,
		groupId,
		groupLabel,
		memberNum,
		notDisturb,
		contains,
		groupName,
		privacyProtection,
		createTime,
		joinAudit,
		forbidEditGroupName,
		state,
		isAnoymous
	} = originData

	return {
		bannedSpeech,
		groupOwnerId,
		viewHistory,
		forbidMemberJoin,
		temporaryFlag,
		groupAvatar,
		groupId,
		groupLabel,
		memberNum,
		notDisturb,
		contains,
		groupName,
		privacyProtection,
		createTime,
		joinAudit,
		forbidEditGroupName,
		state,
		isAnoymous
	}
}

