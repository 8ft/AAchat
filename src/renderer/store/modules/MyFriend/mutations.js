import Vue from 'vue'

export default {
	setList(state, data = []) {
		state.list = data
	},
	updateFriendInfo(state, { paylod = {}, index = 'null' }) {
		// if (index	== 'null') {//存在异步时间差时会有原数据index变更导致数据错误问题
		// 	index = state.list.findIndex(item => {
		// 		return item.userId == paylod.userId
		// 	})
		// }
		index = state.list.findIndex(item => {
			return item.userId == paylod.userId
		})
		if (index != -1) {
			const info = Object.assign({}, state.list[index], paylod)
			Vue.set(state.list, index, info)
		} else {
			state.list.unshift(paylod)
		}
	},
	setFriendGroups(state, data = []) {
		state.friendGroups = data
	},
	updateFriendGroupInfo(state, { paylod = {}, index = 'null' }) {
		// if (index	== 'null') {//存在异步时间差时会有原数据index变更导致数据错误问题
		// 	index = state.friendGroups.findIndex(item => {
		// 		return item.friendGroupId == paylod.friendGroupId
		// 	})
		// }
		index = state.friendGroups.findIndex(item => {
			return item.friendGroupId == paylod.friendGroupId
		})
		if (index != -1) {
			const info = Object.assign({}, state.friendGroups[index], paylod)
			Vue.set(state.friendGroups, index, info)
		} else {
			state.friendGroups.unshift(paylod)
		}
	}
}
