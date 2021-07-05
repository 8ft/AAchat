// import { DEFAULT_LANG } from '@/assets/lang'
// const sqlite = require('@/utils/electron/sqlite')
const colourStr = require('@/utils/common/colourStr')
const formatReg = require('@/utils/common/formatReg')

// 获取排序后的会话列表
export const sortedThreads = (state, getters) => {
	if (!state.Chat.threads) return []

	const arr = []
	state.Chat.threads.forEach(thread => {
		if (thread && thread.hidden == 0) {
			arr.push(thread)
		}
	})

	arr.sort((a, b) => {
		let time_a
		let time_b

		if (a.topTime && b.topTime) {
			return b.topTime - a.topTime
		} else if (a.topTime && !b.topTime) {
			return -1
		} else if (b.topTime && !a.topTime) {
			return 1
		}

		time_a = a.lastMessage ? (a.lastMessage.timestamp || 1) : 1
		time_b = b.lastMessage ? (b.lastMessage.timestamp || 1) : 1

		time_a = time_a > a.activeTime ? time_a : a.activeTime
		time_b = time_b > b.activeTime ? time_b : b.activeTime

		return time_b - time_a
	})
	return arr
}

// 群成员
export const groupUsers = (state, getters) => (threadID, groupOwnerId) => {
	const groupUsers = window._.cloneDeep(getters['MyGrounp/groupUsers'](threadID))
	if (!groupUsers.length) return []

	let groupOwner
	const groupManagers = []
	const otherMembers = []

	// 获取群成员信息
	groupUsers.forEach(user => {
		const userInfo = window._.cloneDeep(getters['User/userInfo'](user.userId))
		const friendInfo = window._.cloneDeep(getters['MyFriend/friendInfo'](user.userId))
		window._.assign(user, userInfo, friendInfo)
		if (groupOwnerId && user.userId == groupOwnerId) {
			groupOwner = user
		} else if (user.adminFlag == 2) {
			groupManagers.push(user)
		} else {
			otherMembers.push(user)
		}
	})

	let newGroupUsers = []
	newGroupUsers = [groupOwner, ...groupManagers, ...otherMembers]

	return newGroupUsers
}

// 未处理消息数，包括未读记录和未处理好友添加信息
export const unProcessCount = (state, getters) => {
	const threads = getters.sortedThreads
	const unreadThreads = []
	let isLocked
	const unreadMsgCount = threads.reduce((count, thread) => {
		isLocked = thread.type == 1 && thread.state == 0
		if (thread.unreadCount && !thread.notDisturb && !isLocked) {
			let threadName = ''
			if (thread.type == 10001) {
				if (thread.id === 'notify') {
					threadName = window.i18n.t('common.systemMessage')
				} else if (thread.id === 'point') {
					threadName = window.i18n.t('point.pointsAssisstant')
				}
			} else {
				threadName = thread.name
			}
			unreadThreads.push({ id: thread.id, type: thread.type, unreadCount: thread.unreadCount, name: threadName })
		}
		return (isLocked || thread.notDisturb == 1 || thread.hidden) ? count : (count + thread.unreadCount)
	}, 0)
	const statistic = state.NewFriend.statistics ? state.NewFriend.statistics.todoNum : 0
	return {
		unreadThreads,
		newFriendNum: statistic,
		unProcessCount: unreadMsgCount + statistic
	}
}

// 未读记录数
export const unreadCount = (state, getters) => {
	const threads = getters.sortedThreads
	let isLocked
	return threads.reduce((count = 0, thread) => {
		isLocked = thread.type == 1 && thread.state == 0
		return (isLocked || thread.notDisturb == 1 || thread.hidden) ? count : (count + thread.unreadCount)
	}, 0)
}

// 最新的用户名
export const latestUsername = (state, getters) => (userId, threadType, threadID) => {
	let latestUsername = ''
	const friendInfo = getters['MyFriend/friendInfo'](userId)
	if (friendInfo && friendInfo.label) {
		latestUsername = friendInfo.label
	} else if (threadType == 1) {
		const groupUserInfo = getters['MyGrounp/groupUserInfo'](
			threadID,
			userId
		)
		if (groupUserInfo && groupUserInfo.userLabel) {
			latestUsername = groupUserInfo.userLabel
		}
	}

	if (!latestUsername) {
		const userInfo = getters['User/userInfo'](userId)
		if (userInfo) {
			latestUsername = userInfo.nickName
		}
	}

	return latestUsername
}

// 我的信息
export const userDetail = (state, getters) => (groupId, userId) => {
	return window._.assign({}, getters['MyGrounp/groupUserInfo'](groupId, userId), getters['User/userInfo'](userId), getters['MyFriend/friendInfo'](userId))
}

// 获取所有好友聚合数据（数据格式：[{...myFriend, userInfo}, ...]）
export const friendsDetail = (state, getters) => {
	const myFriends = getters['MyFriend/list']

	const result = myFriends.map(friendInfo => {
		const userInfo = getters['User/userInfo'](friendInfo.userId)
		return Object.assign({}, friendInfo, { userInfo: userInfo })
	})

	return result
}

// 获取所有群组聚合数据（数据格式：[{...groupInfo, userRelationList：[{...userRelationInfo, friendInfo, userInfo}, ...]}, ...]）
export const groupsDetail = (state, getters) => {
	const myGroups = getters['MyGrounp/list']

	const result = myGroups.map(groupInfo => {
		const groupUsers = JSON.parse(JSON.stringify(getters['MyGrounp/groupUsers'](groupInfo.groupId)))
		groupUsers.forEach(groupUser => {
			groupUser.friendInfo = getters['MyFriend/friendInfo'](groupUser.userId) // 可能为{}
			groupUser.userInfo = getters['User/userInfo'](groupUser.userId)
		})
		return Object.assign({}, groupInfo, { groupUsers: groupUsers })
	})

	return result
}

// 使用关键字搜索我的好友---会在对象数组的数据源中添加属性extend={avatar,title,desc}（调整后的数据）
//  频繁调用时friends最好由外部传参提供，减少数据聚合次数
export const friendsDetailFilter = (state, getters) => (text, friends = friendsDetail(state, getters)) => {
	if (!friends.length) return []

	const reg = new RegExp(formatReg(text), 'i')
	const _test = str => reg.test(str)
	const _replace = string => colourStr(string, text)

	const result = []
	friends.forEach(f => {
		const extend = { avatar: f.userInfo.userAvatar, title: '', desc: '' }
		// 备注有关键字，只显示备注
		if (_test(f.label) && f.label) {
			extend.title = _replace(f.label)
		} else if ((!f.label) && _test(f.userInfo.nickName) && f.userInfo.nickName) {
			// 昵称有关键字，并且未设置备注，只显示昵称
			extend.title = _replace(f.userInfo.nickName)
		} else if (f.label && _test(f.userInfo.nickName)) {
			// 昵称有关键字，并且有备注，则上面显示备注，下面显示昵称
			extend.title = _replace(f.label)
			extend.desc = window.i18n.t('userCard.nickname') + '：' + _replace(f.userInfo.nickName)
		} else if ((!f.label) && _test(f.userInfo.accountCode)) {
			// id有关键字，并且未备注，显示昵称、AAid
			extend.title = _replace(f.userInfo.nickName)
			extend.desc = ('ID：') + _replace(f.userInfo.accountCode)
		} else if (f.label && _test(f.userInfo.accountCode)) {
			// AAid有关键字，并且有备注，显示备注、AAid
			extend.title = _replace(f.label)
			extend.desc = ('ID：') + _replace(f.userInfo.accountCode)
		} else if (_test(f.userInfo.userMobile)) {
			if (f.label) {
				// 手机号有关键字，并却又备注，显示备注、手机号
				extend.title = _replace(f.label)
				extend.desc = window.i18n.t('common.mobileNumber') + '：' + _replace(f.userInfo.userMobile)
			} else {
				// 手机号有关键字，并却又未备注，显示昵称、手机号
				extend.title = _replace(f.userInfo.nickName)
				extend.desc = window.i18n.t('common.mobileNumber') + '：' + _replace(f.userInfo.userMobile)
			}
		}
		if (extend.title || extend.desc) result.push({ ...f, extend })
	})
	return result
}

// 使用关键字搜索我的群组---会在对象数组的数据源中添加属性extend={avatar,title,desc}（调整后的数据）
export const groupsDetailFilter = (state, getters) => (text, groups = groupsDetail(state, getters)) => {
	if (!groups.length) return []
	const reg = new RegExp(formatReg(text), 'i')
	const _test = str => reg.test(str)
	const _replace = string => colourStr(string, text)

	const result = []
	groups.forEach(g => {
		const extend = { avatar: g.groupAvatar, title: '', desc: '' }
		// 群名称有关键字，只显示群名称
		if (_test(g.groupName)) {
			extend.title = _replace(g.groupName)
		} else {
			extend.desc = window.i18n.t('common.include') + '：'
			// 查找群成员信息是否有关键字
			g.groupUsers.forEach(u => {
				// 群成员备注有关键字
				if (_test(u.friendInfo.label) && u.friendInfo.label) {
					extend.desc += _replace(u.friendInfo.label) + '、'
				} else if (_test(u.userLabel) && u.userLabel && !u.friendInfo.label) {
					// 群成员在群里的备注有关键字
					extend.desc += _replace(u.userLabel) + '、'
				} else if (_test(u.userLabel) && u.userLabel && u.friendInfo.label) {
					// 群成员在群里的备注有关键字
					extend.desc += u.friendInfo.label + `(${_replace(u.userLabel)})` + '、'
				} else if (_test(u.userInfo.nickName) && !u.friendInfo.label && !u.userLabel) {
					// 群成员昵称有关键字，并且两种都没备注
					extend.desc += _replace(u.userInfo.nickName) + '、'
				} else if (_test(u.userInfo.nickName) && u.friendInfo.label) {
					// 群成员昵称有关键字，并且在好友有备注
					extend.desc += _replace(u.friendInfo.label + `(${u.userInfo.nickName})`) + '、'
				} else if (_test(u.userInfo.nickName) && u.userLabel) {
					// 群成员昵称有关键字，并且在群里有备注
					extend.desc += _replace(u.userLabel + `(${u.userInfo.nickName})`) + '、'
				} else if (_test(u.userInfo.accountCode) && !u.userLabel && !u.friendInfo.label) {
					// AAid有关键字，并且两种都未备注
					extend.desc += _replace(u.userInfo.nickName) + '(' + _replace(u.userInfo.accountCode) + ')' + '、'
				} else if (_test(u.userInfo.accountCode) && u.friendInfo.label) {
					// AAid有关键字，并且有好友备注
					extend.desc += _replace(u.friendInfo.label) + '(' + _replace(u.userInfo.accountCode) + ')' + '、'
				} else if (_test(u.userInfo.accountCode) && u.userLabel) {
					// AAid有关键字，并且群里有备注
					extend.desc += _replace(u.userLabel) + '(' + _replace(u.userInfo.accountCode) + ')' + '、'
				}	else if (_test(u.userInfo.userMobile)) {
					// 如果群成员手机有关键字，优先显示还有备注加手机，在显示群备注、昵称加手机
					if (u.friendInfo.label) extend.desc += _replace(u.friendInfo.label) + '(' + _replace(u.userInfo.userMobile) + ')' + '、'
					else if (u.userLabel) extend.desc += _replace(u.userLabel) + '(' + _replace(u.userInfo.userMobile) + ')' + '、'
					else extend.desc += _replace(u.userInfo.nickName) + '(' + _replace(u.userInfo.userMobile) + ')' + '、'
				}
			})
			// 需要判断上面条件是否有符合的
			if (extend.desc.length > window.i18n.t('common.include').length + 1) {
				extend.desc = extend.desc.substring(0, extend.desc.length - 1)
				extend.title = _replace(g.groupName)
			} else {
				extend.desc = ''
			}
		}
		if (extend.title || extend.desc) result.push({ ...g, extend })
	})
	return result
}
