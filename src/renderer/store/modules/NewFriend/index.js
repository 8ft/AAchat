import * as getters from './getters'
import * as actions from './actions'
import mutations from './mutations'

const state = {
	list: [], //  新的好友列表
	statistics: {} //  统计数据
}

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations
}
