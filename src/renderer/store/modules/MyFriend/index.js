import * as getters from './getters'
import * as actions from './actions'
import mutations from './mutations'

const state = {
	list: [], // 我的好友列表
	friendGroups: [] // 好友分组列表
}

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations
}
