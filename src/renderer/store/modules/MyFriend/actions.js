const { user } = require('@/utils/electron/api')

// 设置我的好友列表数据---set_list([...]/null)
export const set_list = ({ rootState, state, commit }, paylod) => {
	return new Promise((resolve, reject) => {
		if (paylod) {
			commit('setList', paylod)
			resolve(paylod)
		} else {
			user.myFriendRelationList().get().then(res => {
				commit('setList', res.data || [])
				resolve(res.data)
			}).catch(e => {
				reject(e)
			})
		}
	})
}

// 更新我的好友信息(添加/更新)---update_info({userId:123})
export const update_info = ({ rootState, state, commit }, paylod = {}) => {
	return new Promise((resolve, reject) => {
		const index = rootState.MyFriend.list.findIndex(item => {
			return item.userId == paylod.userId
		})
		if (index != -1) {
			// const data = rootState.MyFriend.list.map(item => {
			// 	const newInfo = item.userId == paylod.userId ? Object.assign({}, item, paylod) : item
			// 	return newInfo
			// })
			// commit('setList', data)
			// resolve(data)
			commit('updateFriendInfo', { paylod, index })
			resolve()
		} else { // 获取单条好友信息的接口后台没维护
			// data = [paylod].concat(rootState.MyFriend.list)
			user.myFriendRelationList().get().then(res => {
				commit('setList', res.data || [])
				resolve(res.data)
			}).catch(e => {
				reject(e)
			})
		}
	})
}

// 删除某个我的好友---delete_info({userId:123})
export const delete_info = ({ rootState, state, commit }, paylod = {}) => {
	return new Promise((resolve, reject) => {
		const newList = rootState.MyFriend.list.filter(item => item.userId != paylod.userId)
		commit('setList', newList)
		resolve(newList)
	})
}

//  设置好友分组列表数据---set_friendGroups([...]/null)
export const set_friendGroups = ({ rootState, state, commit }, paylod) => {
	return new Promise((resolve, reject) => {
		if (paylod) {
			commit('setFriendGroups', paylod)
			resolve(paylod)
		} else {
			user.getFriendGroups().get().then(res => {
				commit('setFriendGroups', res.data || [])
				resolve(res.data)
			}).catch(e => {
				reject(e)
			})
		}
	})
}

// 更新好友分组信息(添加/更新)---update_friendGroupInfo({friendGroupId:123, reload: true/false})
export const update_friendGroupInfo = ({ rootState, state, commit }, paylod = {}) => {
	return new Promise((resolve, reject) => {
		const index = rootState.MyFriend.friendGroups.findIndex(item => {
			return item.friendGroupId == paylod.friendGroupId
		})
		if (index != -1) {
			if (paylod.reload) {
				user.getFriendGroupInfo({ friendGroupId: paylod.friendGroupId }).get().then(res => {
					// const data = rootState.MyFriend.friendGroups.map(item => {
					// 	const newInfo = item.friendGroupId == paylod.friendGroupId ? res.data : item
					// 	return newInfo
					// })
					// commit('setFriendGroups', data)
					// resolve(data)
					commit('updateFriendGroupInfo', { paylod:	res.data, index })
					resolve()
				}).catch(e => {
					reject(e)
				})
			} else {
				// const data = rootState.MyFriend.friendGroups.map(item => {
				// 	const newInfo = item.friendGroupId == paylod.friendGroupId ? Object.assign({}, item, paylod) : item
				// 	return newInfo
				// })
				// commit('setFriendGroups', data)
				// resolve(data)
				commit('updateFriendGroupInfo', { paylod, index })
				resolve()
			}
		} else {
			user.getFriendGroupInfo({ friendGroupId: paylod.friendGroupId }).get().then(res => {
				// const data = rootState.MyFriend.friendGroups.concat([res.data])
				// commit('setFriendGroups', data)
				// resolve(data)
				commit('updateFriendGroupInfo', { paylod:	res.data, index })
				resolve()
			}).catch(e => {
				reject(e)
			})
		}
	})
}

// 删除好友分组信息---delete_friendGroupInfo({friendGroupId:123})
export const delete_friendGroupInfo = ({ rootState, state, commit }, paylod) => {
	return new Promise((resolve, reject) => {
		const newList = rootState.MyFriend.friendGroups.filter(item => item.friendGroupId != paylod.friendGroupId)
		commit('setFriendGroups', newList)
		resolve(newList)
	})
}

