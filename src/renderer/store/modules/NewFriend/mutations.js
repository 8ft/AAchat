import Vue from 'vue'

export default {
	setList(state, data = []) {
		state.list = data
	},
	updateNewFriendInfo(state, { paylod = {},	index	=	'null' }) {
		// if (index	== 'null') {//存在异步时间差时会有原数据index变更导致数据错误问题
		// 	index = state.list.findIndex(item => {
		// 		return paylod.id ? (item.id == paylod.id) : (item.fromUserId == paylod.fromUserId)
		// 	})
		// }
		index = state.list.findIndex(item => {
			return paylod.id ? (item.id == paylod.id) : (item.fromUserId == paylod.fromUserId)
		})
		if (index != -1) {
			const info = Object.assign({}, state.list[index], paylod)
			Vue.set(state.list, index, info)
		} else {
			state.list.unshift(paylod)
		}
	},
	setStatistics(state, data = {}) {
		state.statistics = data
	}
}
