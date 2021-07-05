import crypto from 'crypto'
import moment from 'moment'
import os from 'os'
import { machineIdSync } from 'node-machine-id'

export default {
	apiSign(paramsJson) {
		paramsJson = Object.assign({}, paramsJson)
		paramsJson.appSecret = process.env.webConfig.proxy_appSecret
		// 参数字段排序，为签名准备
		const tempKeyArray = []
		for (const key in paramsJson) {
			// 参数值为空的不参与排序
			if (paramsJson[key] !== '' && paramsJson[key] !== undefined && paramsJson[key] !== null) tempKeyArray.push(key)
		}
		const keyArray = Object.assign([], tempKeyArray.sort())
		let params = ''
		for (let i = 0; i < keyArray.length; i++) {
			params += `${keyArray[i]}=${paramsJson[keyArray[i]]}`
			if (i != keyArray.length - 1) params += '&'
		}
		return this.md5(params).toUpperCase()
	},
	/**
	 * 图片等比缩放
	 */
	resizeImage(width, height, maxWidth, maxHeight) {
		let tempWidth
		let tempHeight
		let containerWidth
		let containerHeight
		if (width > 0 && height > 0) {
			// 原图片宽高比例 大于 指定的宽高比例，这就说明了原图片的宽度必然 > 高度
			if (width / height >= maxWidth / maxHeight) {
				if (width > maxWidth) {
					if (width / height > 5) {
						tempHeight = maxHeight / 1.5
						tempWidth = width * tempHeight / height
						containerWidth = tempHeight * 2
					} else {
						tempWidth = maxWidth
						// 按原图片的比例进行缩放
						tempHeight = height * tempWidth / width
						containerWidth = tempWidth
					}
					containerHeight = tempHeight
				} else {
					// 按原图片的大小进行缩放
					tempWidth = width
					tempHeight = height
					containerWidth = tempWidth
					containerHeight = tempHeight
				}
			} else { // 原图片的高度必然 > 宽度
				if (height > maxHeight) {
					if (height / width > 5) {
						tempWidth = maxWidth / 1.5
						tempHeight = height * tempWidth / width
						containerHeight = tempWidth * 2
					} else {
						tempHeight = maxHeight
						// 按原图片的比例进行缩放
						tempWidth = width * tempHeight / height
						containerHeight = tempHeight
					}
					containerWidth = tempWidth
				} else {
					// 按原图片的大小进行缩放
					tempWidth = width
					tempHeight = height
					containerWidth = tempWidth
					containerHeight = tempHeight
				}
			}
		}
		return {
			width: parseInt(tempWidth),
			height: parseInt(tempHeight),
			containerWidth: parseInt(containerWidth),
			containerHeight: parseInt(containerHeight)
		}
	},
	randomId() {
		const random = (parseInt(Math.random() * 10000000000000 + 1)).toString()
		const timestamp = (new Date().getTime()).toString()
		return timestamp + random
	},
	getZoneTime() {
		const Offset = moment().utcOffset()
		var zone = parseInt(Offset / 60)
		var minite = Offset % 60
		return {
			zone,
			minite
		}
	},
	md5: function(str) {
		return crypto.createHash('md5').update(str).digest('hex')
	},
	os: require('../renderer/utils/common/os'),
	/* 格式化时间*/
	// 对Date的扩展，将 Date 转化为指定格式的String
	// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
	// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
	// 例子：
	// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
	// (new Date()).Format("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
	formatDate: function(nowDate, fmt) { // author: meizz
		fmt = fmt || 'yyyy-MM-dd'
		var o = {
			'M+': nowDate.getMonth() + 1, // 月份
			'd+': nowDate.getDate(), // 日
			'h+': nowDate.getHours(), // 小时
			'm+': nowDate.getMinutes(), // 分
			's+': nowDate.getSeconds(), // 秒
			'q+': Math.floor((nowDate.getMonth() + 3) / 3), // 季度
			'S': nowDate.getMilliseconds() // 毫秒
		}
		if (/(y+)/.test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (nowDate.getFullYear() + '').substr(4 - RegExp.$1.length))
		}
		for (var k in o) {
			if (new RegExp('(' + k + ')').test(fmt)) {
				fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
			}
		}
		return fmt
	},
	// data 是你的准备解密的字符串,key是你的密钥
	decryption: function(data, key, iv) {
		iv = iv || ''
		var clearEncoding = 'utf8'
		var cipherEncoding = 'base64'
		var cipherChunks = []
		var decipher = crypto.createDecipheriv('aes-256-ecb', key, iv)
		decipher.setAutoPadding(true)
		cipherChunks.push(decipher.update(data, cipherEncoding, clearEncoding))
		cipherChunks.push(decipher.final(clearEncoding))
		return cipherChunks.join('')
	},
	// data 是准备加密的字符串,key是你的密钥
	encryption: function(data, key, iv) {
		iv = iv || ''
		var clearEncoding = 'utf8'
		var cipherEncoding = 'base64'
		var cipherChunks = []
		var cipher = crypto.createCipheriv('aes-256-ecb', key, iv)
		cipher.setAutoPadding(true)
		cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding))
		cipherChunks.push(cipher.final(cipherEncoding))
		return cipherChunks.join('')
	},
	// json字符串判断
	isJSONString: function(str) {
		if (typeof str == 'string') {
			try {
				var obj = JSON.parse(str)
				if (typeof obj == 'object' && obj) {
					return true
				} else {
					return false
				}
			} catch (e) {
				return false
			}
		}
	},
	// 判断是否是数组
	isArray: function(obj) {
		return Object.prototype.toString.call(obj) == '[object Array]'
	},
	// 判断是否是对象
	isObject: function(obj) {
		return Object.prototype.toString.call(obj) == '[object Object]'
	},
	// 设备类型
	getDeviceType() {
		let deviceType = ''
		switch (process.platform) {
			case 'darwin':
				deviceType = '4'
				break
			case 'win32':
				deviceType = '3'
				break
		}
		return deviceType
	},
	getDeviceModel() {
		const deviceType = this.getDeviceType()
		switch (deviceType) {
			case '4':
				return 'mac'
			case '3':
				return 'windows'
		}
	},
	// 设备信息
	getDeviceSystem() {
		// return `${os.type()},${os.arch()},${os.release()},${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}G`
		return os.release()
	},
	// 设备mac
	getMac() {
		var network = os.networkInterfaces()
		const ipArray = []
		for (var key in network) {
			for (var i = 0; i < network[key].length; i++) {
				var tempIp = network[key][i]
				if (!tempIp.internal && tempIp.family === 'IPv4' && tempIp.address !== '127.0.0.1' && !tempIp.address.includes('::')) {
					ipArray.push(tempIp)
				}
			}
		}
		console.log(ipArray)
	},
	// 设备id
	getDeviceId() {
		const id = machineIdSync()
		return id
	},

	waiting(time) {
		return new Promise(resolve => setTimeout(resolve, time))
	}
}
