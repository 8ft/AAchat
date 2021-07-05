export const list = state => state.list

export const getFriend = (state) => (param) => {
	return state.list.filter(user => {
		let isEquire = true
		Object.keys(param).forEach(key => {
			if (user[key] != param[key] && isEquire) isEquire = false
		})
		return isEquire
	})
}

export const groupInfo = (state) => (groupId) => {
	return state.list.find(li => {
		return li.groupId == groupId
	}) || {}
}

export const friendInfo = (state) => (userId) => {
	return state.list.find(li => {
		return li.userId == userId
	}) || {}
}

// 好友群组相关：
export const friendGroups = state => state.friendGroups

export const friendGroupInfo = (state) => (friendGroupId) => {
	return state.friendGroups.find(li => {
		return li.friendGroupId == friendGroupId
	}) || {}
}

