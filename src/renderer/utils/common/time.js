import fun from '@/utils/electron/fun'
const moment = require('moment')

export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

export function formatForList(date) { // author:chenrb；当天时间显示为xx:xx；昨天显示为昨天；昨天以前显示为 xx/xx；不在同一年显示：显示为xxxx/xx/xx
	if (!date) return date
	date = new Date((typeof date == 'string') ? date.replace(/\-/g, '/') : date)
	const nowDate = new Date(fun.getServerTime('formatForList'))
	if (nowDate.setHours(0, 0, 0, 0) <= date.getTime()) {
		date = moment(date).format('HH:mm')
	} else if (nowDate.setHours(0, 0, 0, 0) - date.getTime() < 86400000) {
		date = window.i18n.t('common.yesterday')
	} else if (nowDate.getFullYear() != date.getFullYear()) {
		date = moment(date).format('YYYY/MM/DD')
	} else {
		date = moment(date).format('MM/DD')
	}
	return date
}

export function formatForDetail(date, serverTime) { // author:chenrb；当天时间显示为xx:xx；昨天显示为昨天 xx:xx；昨天以前显示为 xx/xx xx:xx；不在同一年显示：显示为xxxx/xx/xx xx:xx
	if (!date) return date
	date = new Date((typeof date == 'string') ? date.replace(/\-/g, '/') : date)
	const nowDate = serverTime ? new Date(serverTime) : new Date(fun.getServerTime('formatForDetail'))
	if (nowDate.setHours(0, 0, 0, 0) <= date.getTime()) {
		date = moment(date).format('HH:mm')
	} else if (nowDate.setHours(0, 0, 0, 0) - date.getTime() < 86400000) {
		date = `${window.i18n.t('common.yesterday')} ${moment(date).format('HH:mm')}`
	} else if (nowDate.getFullYear() != date.getFullYear()) {
		date = moment(date).format('YYYY/MM/DD HH:mm')
	} else {
		date = moment(date).format('MM/DD HH:mm')
	}
	return date
}

/**
 * 时间戳转化为年 月 日 时 分 秒
 * timestamp: 传入时间戳
 * format：返回格式，支持自定义，但参数必须与formateArr里保持一致
 *
 * @example
 * this.$utils.time.formatTimestamp(timestamp,'Y/M/D h:m:s')
 *
 * Author:YanXiaofeng
 */
export function formatTimestamp(timestamp, format) {
	const formateArr = ['Y', 'M', 'D', 'h', 'm', 's']
	const returnArr = []

	const date = new Date(parseInt(timestamp))
	returnArr.push(date.getFullYear())
	returnArr.push(formatNumber(date.getMonth() + 1))
	returnArr.push(formatNumber(date.getDate()))

	returnArr.push(formatNumber(date.getHours()))
	returnArr.push(formatNumber(date.getMinutes()))
	returnArr.push(formatNumber(date.getSeconds()))

	for (const i in returnArr) {
		format = format.replace(formateArr[i], returnArr[i])
	}

	return format
}

// 数据转化
function formatNumber(n) {
	n = n.toString()
	return n[1] ? n : '0' + n
}

// 时间戳转化为在线时间
export function formatOnlineTime(timestamp, serverTime) {
	// 时间戳
	let result = ''
	serverTime = serverTime || fun.getServerTime('formatOnlineTime')
	const interval = (serverTime || Date.now()) - timestamp
	function isToday(timestamp) {
		return new Date(Number(timestamp)).setHours(0, 0, 0, 0) == new	Date(serverTime).setHours(0, 0, 0, 0)
	}
	if (!timestamp) {
		result = window.i18n.t('common.offline')
	} else if (interval < 1000 * 60) {
		result = window.i18n.t('chat.justNow') + window.i18n.t('common.online')
	} else if (interval < 1000 * 60 * 60) {
		result = window.i18n.tc('chat.minuteAgo', Math.floor(interval / (1000 * 60)))
	// } else if (interval < 1000 * 60 * 60 * 24) {
	} else if (isToday(timestamp)) {
		result = window.i18n.tc('chat.hourAgo', Math.floor(interval / (1000 * 60 * 60)))
	} else if (new Date(serverTime).getFullYear() == new Date(Number(timestamp)).getFullYear()) {
		result = formatTimestamp(timestamp, 'M/D') + window.i18n.t('common.online')
	} else {
		result = formatTimestamp(timestamp, 'Y/M/D') + window.i18n.t('common.online')
	}
	return result
}

export function getLeftBanTime(leftTime) {
	const day = Math.ceil(leftTime / 86400)
	if (day > 1) {
		// return `${day}天`
		return window.i18n.tc('chat.dayNumber', day)
	}

	const hour = Math.floor(leftTime / 3600)
	let minite = Math.floor(leftTime % 3600 / 60)
	if (hour > 1) {
		if (hour == 24 || (hour == 23 && minite == 60)) {
			return window.i18n.tc('chat.dayNumber', 1)
		}

		if (minite > 0) {
			// return `${hour}小时${minite}分钟`
			return window.i18n.tc('chat.hourNumber', hour) + ' ' + window.i18n.tc('chat.minuteNumber', minite)
		}

		// return `${hour}小时`
		return window.i18n.tc('chat.hourNumber', hour)
	}

	minite = Math.ceil(leftTime / 60)
	if (minite >= 1) {
		if (minite == 60) {
			// return '1小时'
			return window.i18n.tc('chat.hourNumber', 1)
		}
		// return `${minite}分钟`
		return window.i18n.tc('chat.minuteNumber', minite)
	} else {
		// return `1分钟`
		return window.i18n.tc('chat.minuteNumber', 1)
	}
}
