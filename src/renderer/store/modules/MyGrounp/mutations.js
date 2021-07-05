import Vue from 'vue'

export default {
	setList(state, data = []) {
		state.list = data
	},
	updateGroupInfo(state, { paylod = {}, index = 'null' }) {
		// if (index	== 'null') {//存在异步时间差时会有原数据index变更导致数据错误问题
		// 	index = state.list.findIndex(item => {
		// 		return item.groupId == paylod.groupId
		// 	})
		// }
		index = state.list.findIndex(item => {
			return item.groupId == paylod.groupId
		})
		if (index != -1) {
			const info = Object.assign({}, state.list[index], paylod)
			Vue.set(state.list, index, info)
		} else {
			state.list.unshift(paylod)
		}
	},
	setUserRelationList(state, data = []) {
		state.userRelationList = data
	},
	updateUserRelationInfo(state, { paylod = {}, index = 'null' }) {
		// if (index == 'null') {//存在异步时间差时会有原数据index变更导致数据错误问题
		// 	index = state.userRelationList.findIndex(item => {
		// 		return item.groupId == paylod.groupId && (paylod.userId ? (item.userId == paylod.userId) : true)
		// 	})
		// }
		index = state.userRelationList.findIndex(item => {
			return item.groupId == paylod.groupId && (paylod.userId ? (item.userId == paylod.userId) : true)
		})
		if (index != -1) {
			const info = Object.assign({}, state.userRelationList[index], paylod)
			Vue.set(state.userRelationList, index, info)
		} else {
			state.userRelationList.unshift(paylod)
		}
	}
}
