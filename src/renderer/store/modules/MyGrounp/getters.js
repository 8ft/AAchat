export const list = state => state.list

export const userRelationList = state => state.userRelationList

export const getUserRelation = (state) => (param) => {
	return state.userRelationList.filter(userRelation => {
		let isEquire = true
		Object.keys(param).forEach(key => {
			if (userRelation[key] != param[key] && isEquire) isEquire = false
		})
		return isEquire
	})
}

export const groupInfo = (state) => (groupId) => {
	return state.list.find(li => {
		return li.groupId == groupId
	}) || {}
}

export const groupUsers = (state) => (groupId) => {
	return state.userRelationList.filter(li => {
		return li.groupId == groupId
	})
}

export const groupUserInfo = (state) => (groupId, userId) => {
	return state.userRelationList.find(li => {
		return li.groupId == groupId && li.userId == userId
	}) || {}
}

// export const getGrounpInfo = (state, params) => {
//   return state.MyGrounp.list.filter(item => {return item.groupId == params.groupId})[0] || {}
// }
//
// export const getRelationListByGroupId = (state, params) => {
//   return state.MyGrounp.userRelationList.filter(item => {return item.groupId == params.groupId})
// }
