import Vue from 'vue'
import formatReg from './formatReg'
import colourStr from './colourStr'

// 防抖
export function debounce(fn, timeout = 300) {
	let timer
	return (...args) => {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => {
			fn.apply(fn, args)
		}, timeout)
	}
}

// 搜索框模糊搜索
// searchText: 搜索内容  allgroup：搜索的数组范围
export function searchfilter(searchText, allgroup) {
	const reg = new RegExp(formatReg(searchText).replace('\\', ''), 'i')
	const _replace = string => colourStr(string, searchText)
	const _test = (str) => reg.test(str)
	let title = ''
	let desc = ''
	let avatar = ''
	let searchoptons = []
	const _set = object => {
		Vue.set(object, 'title', title)
		Vue.set(object, 'desc', desc)
		Vue.set(object, 'avatar', avatar)
		searchoptons.push(object)
	}
	if (searchText) {
		allgroup.forEach(item => {
			avatar = item.userAvatar
			if (_test(item.label)) {
				title = _replace(item.label)
				desc = ''
				_set(item)
			} else if (_test(item.nickName)) {
				if (item.label) {
					// 昵称有关键字，并且有备注，则上面显示备注，下面显示昵称
					title = _replace(item.label)
					desc = window.i18n.t('userCard.nickname') + ':' + _replace(item.nickName)
					_set(item)
				} else {
					// 昵称有关键字，并且未设置备注，只显示昵称
					title = _replace(item.nickName)
					desc = ''
					_set(item)
				}
			} else if (_test(item.userMobile)) {
				if (item.label) {
					// 手机号有关键字，并却又备注，显示备注、手机号
					title = _replace(item.label)
					desc = window.i18n.t('login.loginByMobile') + ':' + _replace(item.userMobile)
					_set(item)
				} else {
					// 手机号有关键字，并却又未备注，显示昵称、手机号
					title = _replace(item.nickName)
					desc = window.i18n.t('login.loginByMobile') + ':' + _replace(item.userMobile)
					_set(item)
				}
			} else if (_test(item.accountCode)) {
				// id有关键字，并且未备注，显示昵称、AAid
				if (item.label) {
					// AAid有关键字，并且有备注，显示备注、AAid
					title = _replace(item.label)
					desc = ('ID：') + _replace(item.accountCode)
					_set(item)
				} else {
					title = _replace(item.nickName)
					desc = ('ID：') + _replace(item.accountCode)
					_set(item)
				}
			} else if (_test(item.userLabel)) {
				// 群昵称有关键字，并且有备注，上面备注，下面群昵称
				if (item.label) {
					title = _replace(item.label)
					desc = window.i18n.t('userCard.groupNickname') + ':' + _replace(item.userLabel)
					_set(item)
				} else {
					title = _replace(item.nickName)
					desc = window.i18n.t('userCard.groupNickname') + ':' + _replace(item.userLabel)
					_set(item)
				}
			}
		})
	} else {
		searchoptons = []
	}
	return searchoptons
}

// 搜索框模糊搜索
// searchText: 搜索内容  allgroup：搜索的数组范围
export function searchGroupMembers(searchText, allgroup, privacyProtection) {
	const reg = new RegExp(formatReg(searchText).replace('\\', ''), 'i')
	const _test = (str) => reg.test(str)
	let searchoptons = []
	if (searchText) {
		allgroup.forEach(item => {
			if (_test(item.label)) {
				searchoptons.push(item)
			} else if (_test(item.nickName)) {
				if (item.label) {
					searchoptons.push(item)
				} else {
					searchoptons.push(item)
				}
			} else if (!privacyProtection && _test(item.userMobile)) {
				if (item.label) {
					searchoptons.push(item)
				} else {
					searchoptons.push(item)
				}
			} else if (!privacyProtection && _test(item.accountCode)) {
				if (item.label) {
					searchoptons.push(item)
				} else {
					searchoptons.push(item)
				}
			} else if (_test(item.userLabel)) {
				if (item.label) {
					searchoptons.push(item)
				} else {
					searchoptons.push(item)
				}
			}
		})
	} else {
		searchoptons = []
	}
	return searchoptons
}
