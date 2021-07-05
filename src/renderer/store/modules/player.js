const state = {
	data102: {},
	data105: {},
	playerData: {}
}

const mutations = {
	SET_DATA102(state, payload) {
		state.data102 = payload
	},
	SET_DATA105(state, payload) {
		state.data105 = payload
	},
	SET_PLAYERDATA(state, payload) {
		state.playerData = payload
	}
}

const actions = {
	set_data102({ commit }, data) {
		commit('SET_DATA102', data)
	},
	set_data105({ commit }, data) {
		commit('SET_DATA105', data)
	},
	set_playerData({ commit }, data) {
		commit('SET_PLAYERDATA', data)
	}
}

export default {
	namespaced: true,
	state,
	mutations,
	actions
}
