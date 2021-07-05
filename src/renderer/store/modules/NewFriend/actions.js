const { message } = require('@/utils/electron/api')

// 设置新的好友列表数据---set_list([...]/null)
export const set_list = ({ rootState, state, commit }, paylod) => {
	return new Promise((resolve, reject) => {
		if (paylod) {
			commit('setList', paylod)
			resolve(paylod)
		} else {
			message.getList().get().then(res => {
				commit('setList', res.data.list || [])
				if (rootState.route.fullPath != '/addressBook/newFriends') {
					commit('setStatistics', { count: res.data.count, todoNum: res.data.todoNum })
					resolve(res.data.list)
				} else {
					if (res.data.todoNum > 0) {
						message.setAllRead().get().then(data => {
							commit('setStatistics', { count: res.data.count, todoNum: 0 })
							resolve(res.data.list)
						})
					} else {
						commit('setStatistics', { count: res.data.count, todoNum: res.data.todoNum })
						resolve(res.data.list)
					}
				}
			}).catch(e => {
				reject(e)
			})
		}
	})
}

// 更新新的好友列表(添加/更新)---update_info({id/fromUserId:123})
export const update_info = ({ rootState, state, commit }, paylod = {}) => {
	return new Promise((resolve, reject) => {
		let data = []
		const index = rootState.NewFriend.list.findIndex(item => {
			return paylod.id ? (item.id == paylod.id) : (item.fromUserId == paylod.fromUserId)
		})
		if (index != -1) {
			// data = rootState.NewFriend.list.map(item => {
			// 	const newInfo = (paylod.id ? (item.id == paylod.id) : (item.fromUserId == paylod.fromUserId)) ? Object.assign({}, item, paylod) : item
			// 	return newInfo
			// })
			commit('updateNewFriendInfo', { paylod, index })
			resolve()
		} else {
			data = [paylod].concat(rootState.NewFriend.list)
			commit('setList', data)
			resolve()
		}
	})
}

// 删除新的好友信息---delete_info({id/fromUserId:123})
export const delete_info = ({ rootState, state, commit }, paylod) => {
	return new Promise((resolve, reject) => {
		const newList = rootState.NewFriend.list.filter(item => {
			return paylod.id ? (item.id != paylod.id) : (item.fromUserId != paylod.fromUserId)
		})
		commit('setList', newList)
		resolve(newList)
	})
}

//  设置统计数据---set_statistics({count: 1, todoNum: 2}/null)
export const set_statistics = ({ rootState, state, commit }, paylod) => {
	return new Promise((resolve, reject) => {
		if (paylod) {
			commit('setStatistics', Object.assign({}, rootState.NewFriend.statistics, paylod))
			resolve()
		} else {
			message.getList().get().then(res => {
				if (rootState.route.fullPath != '/addressBook/newFriends') {
					commit('setStatistics', { count: res.data.count, todoNum: res.data.todoNum })
					resolve({ count: res.data.count, todoNum: res.data.todoNum })
				} else {
					if (res.data.todoNum > 0) {
						message.setAllRead().get().then(data => {
							commit('setStatistics', { count: res.data.count, todoNum: 0 })
							resolve()
						})
					} else {
						commit('setStatistics', { count: res.data.count, todoNum: res.data.todoNum })
						resolve()
					}
				}
			}).catch(e => {
				reject(e)
			})
		}
	})
}

