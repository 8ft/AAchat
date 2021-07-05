export const list = state => state.list

export const statistics = state => state.statistics

export const friendInfo = (state) => (userId) => {
	return state.list.find(friend => {
		return friend.fromUserId == userId
	})
}
