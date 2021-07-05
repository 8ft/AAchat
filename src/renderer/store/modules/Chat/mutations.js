import Vue from 'vue'
export default {
	updateUnSortedMsgs(state, { action, msg, sortedMsgIDs }) {
		if (action === 'init')	{
			state.unSortedMsgs = msg
		} else if (action === 'add') {
			state.unSortedMsgs.push(msg)
		} else if (action === 'del') {
			state.unSortedMsgs = state.unSortedMsgs.filter(msg => {
				return !sortedMsgIDs.includes(msg.id)
			})
		} else if (action === 'clear') {
			state.unSortedMsgs = []
		}
	},

	getAllEmojis(state, data) {
		state.emojis = data
	},

	setDownloadingEmojis(state, data) {
		state.downloadingEmojis = data
	},

	downloadedEmoji(state, data) {
		Vue.set(state.emojis, data.id, data)
	},

	addEmoji(state, data) {
		Vue.set(state.emojis, data.id, data)
		state.emojiSort.unshift(data.id)
	},

	removeEmoji(state, ids) {
		ids.forEach(id => {
			if (state.emojis[id]) {
				Vue.set(state.emojis, id, null)
				state.emojiSort.splice(state.emojiSort.indexOf(id), 1)
			}
		})
	},

	updateEmoji(state, { id, data }) {
		const newEmoji = Object.assign(state.emojis[id], data)
		Vue.set(state.emojis, id, newEmoji)
	},

	updateEmojiSort(state, data) {
		state.emojiSort = data
	},

	addAvatarBgColor(state, { name, color }) {
		state.avatarBgColors[name] = color
	},

	receiveAllThreads(state, threads) {
		state.threads = threads
	},
	setSendFileQueue(state, payload) {
		state.sendFileQueue = payload
	},
	setChatRecordMessage(state, { action, updatingData, id }) {
		switch (action) {
			case 'init':
				state.chatRecordMessage = updatingData
				break
			case 'modify':
				const index = state.chatRecordMessage.findIndex(msg => {
					return msg.id == id
				})
				const newMessage = window._.assign({}, state.chatRecordMessage[index], updatingData)
				if (!updatingData.sendProgress) delete newMessage.sendProgress
				Vue.set(state.chatRecordMessage, index, newMessage)
				break
			case 'clean':
				state.chatRecordMessage = []
		}
	},
	setReFilaNameQueue(state, { action, data }) {
		let index
		switch (action) {
			case 'add':
				state.reFileNameQueue.push(data)
				break
			case 'del':
				index = state.reFileNameQueue.findIndex(msg => {
					return msg.id == data.id
				})
				if (index > -1) state.reFileNameQueue.splice(index, 1)
				break
			case 'modify':
				index = state.reFileNameQueue.findIndex(msg => {
					return msg.id == data.id
				})
				if (index > -1) Vue.set(state.reFileNameQueue, index, data)
				break
		}
	},
	downloadChatRecordFileProgress(state, { id, progress }) {
		const index = state.chatRecordMessage.findIndex(msg => {
			return msg.id == id
		})
		if (index >= 0) {
			const newMessage = window._.assign({}, state.chatRecordMessage[index])
			if (progress === '' || progress === 100) {
				delete newMessage.sendProgress
			} else {
				newMessage.sendProgress = progress
			}
			Vue.set(state.chatRecordMessage, index, newMessage)
		}
	},
	updatePreloading(state, val) {
		state.preloading = val
	},

	loadMessages(state, { isFirstPage, messages }) {
		messages = messages.reverse()
		if (isFirstPage) {
			state.messages = messages
		} else {
			state.messages.unshift.apply(state.messages, messages)
		}
	},

	removeMessageByIndex(state, targetMsgIndex) {
		state.messages.splice(targetMsgIndex, 1)
	},

	receiveMessage(state, message) {
		if (state.messages.length === 0) {
			state.messages.push(message)
		} else {
			const msgCount = state.messages.length - 1
			const earliestMsg = state.messages[0]
			const latestMsg = state.messages[msgCount]
			if (message.timestamp < earliestMsg.timestamp) {
				state.messages.unshift(message)
			} else if (latestMsg.timestamp < message.timestamp) {
				state.messages.push(message)
			} else {
				let msg
				for (let i = msgCount; i >= 0; i--) {
					msg = state.messages[i]
					if (message.timestamp >= msg.timestamp) {
						state.messages.splice(i + 1, 0, message)
						break
					}
				}
			}
		}
	},

	clearMsg(state, { userId, exclude, timestamp }) {
		if (userId) {
			state.messages = state.messages.filter(msg => {
				if (exclude === "(cForm!=53 or mType in ('tip_withdraw','tip_withdrawAll'))") {
					return msg.senderID != userId || (msg.cForm == 53 && ['tip_withdraw', 'tip_withdrawAll'].indexOf(msg.mType) < 0) || msg.timestamp > timestamp
				} else if (!exclude) {
					return msg.senderID != userId || msg.timestamp > timestamp
				}
			})
		} else {
			state.messages = state.messages.filter(msg => {
				return msg.timestamp >= timestamp
			})
		}
	},

	delMsg(state, ids) {
		state.messages = state.messages.filter(message => {
			return ids.indexOf(message.id.toString()) < 0 && ids.indexOf(message.originID.toString()) < 0
		})
	},
	downloadFavFileProgress(state, { id, progress }) {
		const index = state.collectChat.findIndex(msg => {
			return msg.id == id
		})
		if (index >= 0) {
			const newMessage = window._.assign({}, state.collectChat[index])
			if (progress === '' || progress === 100) {
				delete newMessage.downloadProgress
			} else {
				newMessage.downloadProgress = progress
			}
			Vue.set(state.collectChat, index, newMessage)
		}
	},
	fileProgress(state, { msgID, progress, uploadKey, downloadRate }) {
		const index = state.messages.findIndex(msg => {
			return msg.id == msgID
		})
		if (index >= 0) {
			const newMessage = {}
			if (progress === '' || progress === 100) {
				newMessage.sendProgress = undefined
				newMessage.uploadKey = undefined
				newMessage.downloadRate = undefined
			} else {
				newMessage.sendProgress = progress
				newMessage.uploadKey = uploadKey
				if (downloadRate) newMessage.downloadRate = downloadRate
			}
			if (state.messages[index].cForm === process.env.webConfig.CHAT_MSG_TYPE.TYPE_REPLY) { // 回复里面的下载
				for (const key in newMessage) {
					Vue.set(state.messages[index].replyInfo, key, newMessage[key])
				}
			} else {
				for (const key in newMessage) {
					Vue.set(state.messages[index], key, newMessage[key])
				}
			}
		}
	},
	setImagePlayerArray(state, { action, timestamp, data, targetId }) {
		// console.log('setImagePlayerArray:::', action, timestamp, data)
		let index
		switch (action) {
			case 'add':
				index = state.imagePlayerArray.findIndex(item => {
					return item.timestamp == data.timestamp && item.filePath == data.filePath || item.messageId === data.messageId
				})
				if (index === -1) {
					state.imagePlayerArray.push(data)
				} else {
					Vue.set(state.imagePlayerArray, index, data)
				}
				break
			case 'del':
				index = state.imagePlayerArray.findIndex(item => {
					return item.messageId == targetId
				})
				if (index > -1) state.imagePlayerArray.splice(index, 1)
				break
			case 'modify':
				index = state.imagePlayerArray.findIndex(item => {
					return item.messageId === targetId
				})
				if (index > -1) Vue.set(state.imagePlayerArray, index, window._.assign({}, state.imagePlayerArray[index], data))
				break
			case 'clear':
				if (data && data.senderId) {
					const temp = state.imagePlayerArray.filter(item => {
						if (timestamp) {
							timestamp = item.timestamp > timestamp
						} else {
							timestamp = true
						}
						return item.senderId && (item.senderId !== data.senderId || timestamp)
					})
					state.imagePlayerArray = window._.assign([], temp)
				} else {
					state.imagePlayerArray = []
				}
				break
			case 'push':
				state.imagePlayerArray = window._.assign([], data)
		}
		// console.log('ImagePlayerArray:::', window._.assign([], state.imagePlayerArray))
	},
	switchThread(state, id) {
		state.currentThreadID = id
	},

	createThread(state, { threadInfo }) {
		state.threads.push(threadInfo)
	},

	updateBannedTimeDict(state, data) {
		state.banned_time_dict = data
	},

	updateScrollTo(state, data) {
		state.scrollTo = data || {}
	},

	updateThread(state, { threadID, updatingData }) {
		const index = state.threads.findIndex(thread => {
			return thread && thread.id == threadID
		})
		if (index < 0) return
		for (const key in updatingData) {
			if (key !== 'id') Vue.set(state.threads[index], key, updatingData[key])
		}
	},

	updateMsg(state, { id, ids, updatingData = {}}) {
		if (ids) {
			let index
			let updatingDataCopy
			ids.forEach(id => {
				index = state.messages.findIndex(message => {
					return message.id == id
				})
				if (index >= 0) {
					updatingDataCopy = window._.cloneDeep(updatingData)
					if (updatingDataCopy.unreadCount < 0) {
						updatingDataCopy.unreadCount += state.messages[index].unreadCount
					}
					// Vue.set(state.messages, index, Object.assign(state.messages[index], updatingData))
					for (const key in updatingDataCopy) {
						if (typeof updatingData[key] === 'object') {
							if (!state.messages[index][key]) Vue.set(state.messages[index], key, {})
							for (const subKey in updatingData[key]) {
								Vue.set(state.messages[index][key], subKey, updatingData[key][subKey])
							}
						} else {
							Vue.set(state.messages[index], key, updatingData[key])
						}
				  }
				}
			})
		} else {
			const index = state.messages.findIndex(message => {
				return message.id == id
			})
			if (index < 0) return
			if (updatingData.unreadCount < 0) {
				updatingData.unreadCount += state.messages[index].unreadCount
			}
			// Vue.set(state.messages, index, Object.assign(state.messages[index], updatingData))
			for (const key in updatingData) {
				if (typeof updatingData[key] === 'object') {
					if (!state.messages[index][key]) Vue.set(state.messages[index], key, {})
					for (const subKey in updatingData[key]) {
						Vue.set(state.messages[index][key], subKey, updatingData[key][subKey])
					}
				} else {
					Vue.set(state.messages[index], key, updatingData[key])
				}
			}
		}
	},

	killThread(state, threadID) {
		state.threads = state.threads.filter(thread => {
			return thread.id != threadID
		})
	},
	videoProgress(state, { msgID, progress }) {
		const index = state.messages.findIndex(msg => {
			return msg.id == msgID
		})
		if (index >= 0) {
			const newMessage = window._.assign({}, state.messages[index])
			if (progress === '' || progress === 100) {
				delete newMessage.videoProgress
			} else {
				newMessage.videoProgress = progress
			}
			Vue.set(state.messages, index, newMessage)
		}
	},
	updateMakeVideoThumbnailArray(state, { action, id }) {
		if (action === 'add') {
			state.makeVideoThumbnailArray.push(id)
		} else if (action === 'del') {
			state.makeVideoThumbnailArray.splice(state.makeVideoThumbnailArray.indexOf(id, 1))
		}
	},
	updateDownloadingMsgs(state, { action, id }) {
		if (action === 'add') {
			state.downloadingMsgs.push(id)
		} else if (action === 'del') {
			state.downloadingMsgs.splice(state.downloadingMsgs.indexOf(id, 1))
		}
	},
	/* 添加/更新收藏*/
	updatefavoriate(state, { data, type, isnote }) {
		if (data.meta && typeof (data.meta) == 'string') {
			var obj = (new Function('return ' + data.meta))()
			data.meta = obj
		}
		const index = state.collectChat.findIndex(message => {
			return message.id == data.id
		})
		if (index === -1) {
			if (type) {
				state.collectChat.push(data)
			} else {
				state.collectChat.unshift(data)
			}
		} else {
			const newFav = window._.assign({}, state.collectChat[index], data)
			Vue.set(state.collectChat, index, newFav)
			if (isnote) {
				// 修改笔记后需要将笔记添加到第一条
				state.collectChat.splice(index, 1)
				state.collectChat.unshift(newFav)
			}
		}
	},
	/* 删除收藏*/
	deletdfavoriate(state, ids) {
		state.collectChat = state.collectChat.filter(message => {
			return message.id !== ids
		})
	},
	getcollectList(state, data) {
		data.forEach(item => {
			if (typeof (item.meta) == 'string') {
				const obj = (new Function('return ' + item.meta))()
				item.meta = obj
			}
		})
		state.collectChat = data
	},
	addNote(state, data) {
		if (typeof (data.meta) == 'string') {
			const obj = (new Function('return ' + data.meta))()
			data.meta = obj
		}
		state.collectChat.unshift(data)
	}
}
