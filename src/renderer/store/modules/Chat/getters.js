// 获取当前会话
export const currentThread = (state, getters) => {
	return state.currentThreadID
		? getters.someThread(state.currentThreadID)
		: {}
}

// 获取某个会话
export const someThread = (state) => (threadID, userId) => {
	if (state.threads) {
		return state.threads.find(thread => {
			return thread && (thread.id == threadID || (thread.userId && thread.userId == userId))
		})
	} else {
		return null
	}
}

// 获取某条消息
export const someMessage = (state) => (id) => {
	return state.messages.find(message => {
		return message.id == id || message.originID == id
	})
}
