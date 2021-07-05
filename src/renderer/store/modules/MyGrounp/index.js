import * as getters from './getters'
import * as actions from './actions'
import mutations from './mutations'

const state = {
	list: [], // 群组列表
	userRelationList: [] // 用户关系列表
}

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations
}
