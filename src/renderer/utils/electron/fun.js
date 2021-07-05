import utils from '~/utils'
const { ipcRenderer, remote, clipboard, nativeImage, shell } = require('electron')
const imageOp = require('@/utils/common/imageOp')
const fs = require('fs')
const path = require('path')
const request = require('request')
const chatSdk = require('./chatSdk')
const iconv = require('iconv-lite')
const urlFun = require('url')
const CHAT_MSG_TYPE = process.env.webConfig.CHAT_MSG_TYPE
// 文件对应的文件夹名称
const pathNames = {
	[CHAT_MSG_TYPE.TYPE_IMAGE]: 'imagesPath',
	[CHAT_MSG_TYPE.TYPE_FILE]: 'otherFilesPath',
	[CHAT_MSG_TYPE.TYPE_VOICE]: 'voicesPath',
	[CHAT_MSG_TYPE.TYPE_VIDEO]: 'videosPath',
	[CHAT_MSG_TYPE.TYPE_EMOJI]: 'emojisPath'
}
// 图片后缀
const imgExts = process.env.webConfig.supportImageType
// 视频后缀
const videoExts = process.env.webConfig.supportVideoType

function initFileName(ext) {
	let t = utils.md5(utils.randomId())
	if (ext) t = t + '.' + ext
	return t
}

function getFileExtByPath(filePath) {
	if (!filePath) return ''
	const tempExt = filePath.match(/\.([0-9a-z]+)(?:[\?#]|$)/i)
	return tempExt ? tempExt[1] : 'jpg'
}

module.exports = {
	clearLocalData(organRemoveTime, currentOrganId) {
		return new Promise(async(resolve, reject) => {
			try {
				if (organRemoveTime && organRemoveTime.length > 0) {
					const accountInfo = await this.getAccountInfo()
					const lastLocalMsgTime = accountInfo.lastMessageTime || null
					console.log('目标企业本地最后一条消息时间：', lastLocalMsgTime)

					const hasBeenRemoved = organRemoveTime.some(data => {
						if (data.organId == currentOrganId) {
							console.log('最近一次被目标企业移出时间：', `${data.removeTime}000000`)
						}
						return data.organId == currentOrganId && lastLocalMsgTime && `${data.removeTime}000000` > lastLocalMsgTime
					})

					if (hasBeenRemoved) {
						console.log('已被移出企业，清空该企业本地数据')
						await this.deleteAccount('quit')
						return resolve('cleared')
					}
				}
				resolve()
			} catch (e) {
				console.log(e)
				resolve()
			}
		})
	},

	async getImgInfo(localPath) {
		const imageInfo = await imageOp.getImageSize('file://' + localPath)
		return imageInfo
	},
	writeFile(filePath, data) {
		return fs.writeFileSync(filePath, data)
	},
	initFileName(ext) {
		return initFileName(ext)
	},
	openExternal(url) {
		if (url.toLowerCase().indexOf('http://') === -1 && url.toLowerCase().indexOf('https://') === -1) {
			url = 'http://' + url
		}
		shell.openExternal(url)
	},
	getFileExtByPath(filePath) {
		return getFileExtByPath(filePath)
	},
	getLocalFIleInfo(filePath) { // 获取本地文件信息
		const stat = fs.statSync(filePath)
		const ext = path.extname(filePath).slice(1)
		const fileName = path.basename(filePath)
		return {
			isDirectory: stat.isDirectory(),
			ext,
			fileName,
			fileSize: stat.size,
			path: filePath
		}
	},
	restartApp() {
		ipcRenderer.send('restartApp')
	},
	openUpdateWin(data) {
		ipcRenderer.send('openUpdateWin', data)
	},
	closePlayerWin(data) { // 关闭播放器窗口，包括视频和图片
		ipcRenderer.send('closePlayerWin', data)
	},
	abortDownloadFile(id) {
		ipcRenderer.send('abortDownloadFile', id)
	},
	saveImage(params) {
		return new Promise(resolve => {
			ipcRenderer.send('saveImage', params)
			ipcRenderer.once('saveImage-reply', (event, res) => {
				resolve(res)
			})
		})
	},
	downloadFile(params, callback) {
		ipcRenderer.send('downloadFile', params)
		 ipcRenderer.on('downloadFile-reply-' + params.id, (event, payload) => {
		 	if (payload.state === 'finished' || payload.state === 'abort' || payload.state === 'error' || payload.state === 'save-error' || payload.state === 'canceled') {
				ipcRenderer.removeAllListeners('downloadFile-reply-' + params.id)
			}
			callback(payload)
		})
	},
	downloadFileBySDK(params) {
		return new Promise(resolve => {
			const id = utils.randomId()
			params.replyId = id
			ipcRenderer.send('downloadFileBySDK', params)
			ipcRenderer.once('downloadFileBySDK-reply-' + id, (event, payload) => {
				resolve(payload)
			})
		})
	},
	fileExist(filePath) {
		return new Promise((resolve, reject) => {
			fs.access(filePath || '', fs.constants.F_OK, err => {
				if (err) {
					resolve(false)
				} else {
					resolve(true)
				}
			})
		})
	},
	fileWrite(filePath) {
		return new Promise((resolve, reject) => {
			fs.access(filePath || '', fs.constants.W_OK, err => {
				if (err) {
					resolve(false)
				} else {
					resolve(true)
				}
			})
		})
	},
	openFolder(folderPath) {
		remote.shell.showItemInFolder(folderPath)
	},
	openFile(filePath) {
		return remote.shell.openItem(filePath)
	},
	hideMainWin() {
		ipcRenderer.send('hideMainWin')
	},
	urlExist(url) { // url是否可用, 单文件判断，多文件判断用sdk原生方法cExistsUploadAsync
		if (!url) return Promise.resolve(false)
		return new Promise((resolve, reject) => {
			chatSdk.cExistsUploadAsync(url).then(res => {
				if (res.code === 0) {
					if (res.data.length) {
						resolve(res.data[0].exists)
					} else {
						resolve(false)
					}
				} else {
					resolve(false)
				}
			})
			/* 交由sdk判断文件状态
			const pathname = urlFun.parse(url).pathname
			if (!pathname || pathname === '/') {
				resolve(false)
			} else {
				request.head(url, (error, response, body) => {
					if (error) {
						resolve(false)
					} else {
						resolve(response.statusCode === 200)
					}
				})
			}*/
		})
	},
	validUrl(url) {
		if (url.indexOf('【##HTML##】') > -1 || url.indexOf(' ') > -1) return false
		// 判断域名后缀是否是数字正则，如果是数字，则走ip正则
		const ipReg1 = /^((http|https|ftp)\:\/\/)?.*(\.\d+)(:\d+)?(\/|\?|(\/[^\s]*)+|(\?[^\s]*)+)?$/i
		// ip正则可带端口和参数
		const ipReg2 = /^((http|https|ftp)\:\/\/)?(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d?)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d?)(:\d+)?(\/|\?|(\/[^\s]*)+|(\?[^\s]*)+)?$/i
		// 域名正则可带端口和参数
		const domainReg = /^((http|https|ftp)\:\/\/)?(localhost|(([a-zA-Z0-9][-a-zA-Z0-9]{0,62})((\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+)?\.(cc|top|edu|biz|travel|tel|work|gov|mobi|uk|tv|us|au|jp|hk|tech|cloud|info|online|art|com|cn|org|net|vip|im|io)))(:\d+)?(\/|\?|(\/[^\s]*)+|(\?[^\s]*)+)?$/i
		if (ipReg1.test(url)) { // 先判断是否是数字结尾的，数字结尾则走ip正则
			return ipReg2.test(url)
		} else {
			return domainReg.test(url)
		}
	},
	changeWinStyle(params) {
		ipcRenderer.send('changeWinStyle', params)
	},
	deleteFile(filePath) {
		return new Promise(resolve => {
			if (!fs.existsSync(filePath)) {
				resolve()
				return
			}
			fs.unlink(filePath, () => {
				resolve()
			})
		})
	},
	deleteDir(path) {
		return new Promise(resolve => {
			fs.rmdir(path, () => {
				resolve()
			})
		})
	},
	getWebInfoByURL(url) {
		return new Promise((resolve, reject) => {
			let webTitle = ''
			let webDescription = ''
			if (!url) {
				resolve({
					webTitle,
					webDescription
				})
				return
			}
			if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://')) {
				url = 'http://' + url
			}
			const host = urlFun.parse(url).host || ''
			const getHeaders = {
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
				'Accept-Language': 'zh-CN,zh;q=0.9',
				'Cache-Control': 'max-age=0',
				'Connection': 'keep-alive',
				'Accept-Encoding': 'gzip,deflate',
				'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.81 Safari/537.36 QQBrowser/4.5.122.400`
			}
			if (host) getHeaders.Host = host
			request.get({
				url,
				headers: getHeaders,
				gzip: true,
				encoding: null,
				rejectUnauthorized: false,
				timeout: 5000 // 5秒超时
			}, (error, response, body) => {
				if (error) {
					console.log('getWebInfoByURL:::', error)
				} else {
					try {
						const { statusCode, headers } = response
						// console.log('statusCode:::', statusCode)
						if (statusCode === 200) {
							let html = iconv.decode(body, 'utf-8')
							// 从响应头中提取 charset
							let charset = headers['content-type'] && (headers['content-type'].match(/(?:charset=)(.*)/i))
							if (charset) { // headers里有charset
								charset = charset[1] || 'utf-8'
							} else {
								const charsetArray = html.match(/<meta(.|\n)+?>/ig)
								if (charsetArray.length) {
									for (let i = 0; i < charsetArray.length; i++) {
										const t = charsetArray[i].match(/charset="?(.*[^>"])"?/i)
										if (t && t.length) charset = t[1]
										if (charsetArray[i].toLowerCase().indexOf('http-equiv="content-type"') > -1) {
											charset = charsetArray[i].match(/content="?.*charset=(.*[^>"])"?/i)[1]
											break
										}
									}
								}
							}
							html = iconv.decode(body, charset || 'utf-8')
							webTitle = html.match(/<title.*?>(.*?)<\/title>/is)
							webTitle = webTitle ? webTitle[1] : ''
							webTitle = webTitle.replace(/</g, '＜').replace(/>/g, '＞')
							const webDescArray = html.match(/<meta(.|\n)+?>/ig)
							if (webDescArray.length) {
								for (let i = 0; i < webDescArray.length; i++) {
									if (/name="?description"?/i.test(webDescArray[i])) {
										const temp = webDescArray[i].match(/content="?(.*[^>"])"?/)
										webDescription = temp ? temp[1] : ''
										break
									}
								}
							}
							if (!webDescription) { // 如果没有description,则抓取内容
								let result = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html) // 过滤body
								if (result && result.length === 2) {
									result = result[1]
									result = result.replace(/<\s*script[^>]*>(.|[\r\n])*?<\s*\/script[^>]*>/gi, '')
									result = result.replace(/<\s*style[^>]*>(.|[\r\n])*?<\s*\/style[^>]*>/gi, '')
									result = result.replace(/<\/?[^>]+>/g, '')
									result = result.replace(/\&[a-z]+;/gi, '').replace(/[\r|\n|\s]/g, '').replace(/</g, '＜').replace(/>/g, '＞')
									webDescription = result.slice(0, 100) // 取前100字符
								}
							}
						} else {
						}
					} catch (e) {
						console.error('get-web-info@', e)
					}
				}
				resolve({
					webTitle,
					webDescription
				})
			})
		})
	},
	getServerTime(from) {
		/* let standardTime = this.getGlobalByName('globalStandardTime')
		if (!standardTime) {
			standardTime = new Date().getTime()
		} else {
			standardTime = new Date(standardTime).getTime()
		}
		return standardTime*/
		/* const id = utils.randomId()
		return new Promise((resolve, reject) => {
			ipcRenderer.send('getServerTime', { id })
			ipcRenderer.on('getServerTime-reply-' + id, (event, payload) => {
				resolve(payload)
			})
		})*/
		return ipcRenderer.sendSync('getServerTime', from)
	},
	getGlobalByName(name) {
		return remote.getGlobal(name)
	},
	resetWinSize(params) {
		ipcRenderer.send('resetWinSize', params)
	},
	firstGetCompleted() {
		ipcRenderer.send('firstGetCompleted')
	},
	commitUnreadCount(count) {
		ipcRenderer.send('commitUnreadCount', count)
	},
	deleteAccount(type) {
		return new Promise((resolve, reject) => {
			ipcRenderer.send('deleteAccount', { type })
			ipcRenderer.once('deleteAccount-reply', (e, error) => {
				if (error) {
					console.log(error)
				}
				resolve()
			})
		})
	},
	logout() {
		return new Promise((resolve, reject) => {
			remote.crashReporter.addExtraParameter('token', '')
			ipcRenderer.send('logout')
			ipcRenderer.once('logout-reply', () => {
				resolve()
			})
		})
	},
	clearUserInfo() {
		return new Promise((resolve, reject) => {
			ipcRenderer.send('clearUserInfo')
			ipcRenderer.once('clearUserInfo-reply', () => {
				resolve()
			})
		})
	},
	createWin(option) {
		ipcRenderer.send(option.action, option.params)
	},
	exitChat(params) {
		return new Promise((resolve, reject) => {
			ipcRenderer.send('exitChat', params || {})
			ipcRenderer.once('exitChat-reply', () => {
				resolve()
			})
		})
	},
	getOperationLang() {
		return new Promise((resolve, reject) => {
			ipcRenderer.send('getOperationLang')
			ipcRenderer.once('getOperationLang-reply', (e, arg) => {
				resolve(arg)
			})
		})
	},
	sdkTokenOff() {
		return new Promise((resolve, reject) => {
			ipcRenderer.send('sdkTokenOff')
			ipcRenderer.once('sdkTokenOff-reply', (e, arg) => {
				resolve(arg)
			})
		})
	},
	screenShot() {
		ipcRenderer.send('screenShot', {})
	},
	userResources(params) {
		return new Promise((resolve, reject) => {
			ipcRenderer.send('userResources', params)
			ipcRenderer.once('userResources-reply', (event, res) => {
				if (res.code == 0) {
					resolve(res)
				} else {
					reject(res)
				}
			})
		})
	},
	writeToClipboard(data) {
		if (data.imgPath) {
			clipboard.write({ text: '', html: '' })
			const image = nativeImage.createFromPath(data.imgPath)
			clipboard.writeImage(image)
		} else {
			clipboard.write({ text: data.text || '', html: data.html || '' })
		}
	},
	getAccountInfo() {
		return new Promise((resolve, reject) => {
			ipcRenderer.send('getAccountInfo')
			ipcRenderer.once('getAccountInfo-reply', (event, data) => {
				resolve(data)
			})
		})
	},
	setPlayerWin(data) {
		return new Promise((resolve, reject) => {
			data.opType = 'setPlayerWin'
			ipcRenderer.send('playerWin', data)
		})
	},
	getSysConfig() {
		return new Promise((resolve, reject) => {
			ipcRenderer.send('getSysConfig')
			ipcRenderer.once('getSysConfig-reply', (event, data) => {
				resolve(data)
			})
		})
	},
	setSysConfig(payload) {
		const id = utils.randomId()
		return new Promise((resolve, reject) => {
			ipcRenderer.send('setSysConfig', { id, data: payload })
			ipcRenderer.once('setSysConfig-reply-' + id, (event, data) => {
				resolve(data)
			})
		})
	},
	setChatLang(lang) {
		const id = utils.randomId()
		return new Promise((resolve, reject) => {
			ipcRenderer.send('setChatLang', { id, lang })
			ipcRenderer.once('setChatLang-reply-' + id, (event) => {
				resolve()
			})
		})
	},
	setAccountInfo(data) {
		const id = utils.randomId()
		return new Promise((resolve, reject) => {
			ipcRenderer.send('setAccountInfo', { data, id })
			ipcRenderer.once('setAccountInfo-reply-' + id, (event) => {
				resolve()
			})
		})
	},
	videoTransCode(videoPath, callback) {
		const id = utils.randomId()
		const videoFileName = initFileName('mp4')
		ipcRenderer.send('videoTransCode', { id, videoPath, videoFileName })
		ipcRenderer.on('videoTransCode-reply-' + id, (event, data) => {
			if (data.state === 'finished') ipcRenderer.removeAllListeners('videoTransCode-reply-' + id)
			callback(data)
		})
	},
	changeLang(lang) {
		return new Promise((resolve, reject) => {
			ipcRenderer.send('changeLang', lang)
			resolve()
		})
	},
	notifyMessage(data) {
		ipcRenderer.send('notify', data)
	},
	windowsVisibility(data) {
		ipcRenderer.send('windowsVisibility', data)
	},
	waiting(time, callback) {
		return new Promise(resolve => {
			const interval = setTimeout(() => {
				resolve()
			}, time)
			if (callback && typeof callback === 'function') callback(interval)
		})
	},
	fsLog(data) {
		fs.writeFileSync(path.resolve(remote.getGlobal('userDataPath').otherFilesPath, new Date().getTime() + '.txt'), data)
	},
	/*
	saveImage(fileData, ext) {
		return new Promise(async(resolve, reject) => {
			/!* const id = new Date().getTime()
			ipcRenderer.send('saveImage', { id, buffer })
			ipcRenderer.once('saveImage-reply-' + id, (event, data) => {
				resolve(data)
			})*!/
			try {
				let tempExt
				let file = fileData
				if (!file.name) {
					if (!ext) {
						tempExt = file.match(/^data:image\/(\w+);base64,/i)
						ext = tempExt ? tempExt[1] : 'jpg'
					}
					file = file.replace(/^data:image\/\w+;base64,/i, '')
					file = Buffer.alloc(file.length, file, 'base64')
				} else {
					ext = getFileExtByPath(file.path)
					file = fs.readFileSync(file.path)
				}
				const fileName = initFileName(ext)
				const localPath = path.resolve(remote.getGlobal('userDataPath').imagesPath, fileName)
				fs.writeFileSync(localPath, file)
				const imageInfo = await imageOp.getImageSize('file://' + localPath)
				// const smallFilePath = ''
				// const imageBase64 = ''
				/!* if (imageInfo.width > 300 || imageInfo.height > 300) { // 如果图片的宽高超过300px 则压缩
					let newImageSize = await imageOp.resizeImage(imageInfo.width, imageInfo.height, 300, 300)
					imageBase64 = await imageOp.compressImage('file://' + filePath, { width: newImageSize.width, height: newImageSize.height })
					imageBase64 = imageBase64.replace(/^data:image\/\w+;base64,/i, '')
					imageBase64 = Buffer.alloc(imageBase64.length, imageBase64, 'base64')
					smallFilePath = path.resolve(remote.getGlobal('userDataPath').imagesPath, 'small_' + fileName)
					fs.writeFileSync(smallFilePath, imageBase64)
				}*!/
				resolve({
					localPath,
					localPath_preView: localPath,
					ext,
					width: imageInfo.width,
					height: imageInfo.height
				})
			} catch (e) {
				reject(e)
			}
		})
	},*/
	/*
	saveVoice(buffer) {
		return new Promise((resolve, reject) => {
			/!* const id = new Date().getTime()
			ipcRenderer.send('saveVoice', { id, buffer })
			ipcRenderer.once('saveVoice-reply-' + id, (event, data) => {
				resolve(data)
			})*!/
			const fileName = initFileName('aac')
			const fileNamePath = path.resolve(remote.getGlobal('userDataPath').voicesPath, fileName)
			const writerStream = fs.createWriteStream(fileNamePath)
			writerStream.write(buffer, 'base64')
			writerStream.end()
			writerStream.on('finish', function() {
				resolve({
					localPath: fileNamePath
				})
			})
			writerStream.on('error', function(err) {
				reject(err.stack)
			})
		})
	},*/
	getVideoMetaData(videoPath) {
		return new Promise((resolve, reject) => {
			const id = utils.randomId()
			ipcRenderer.send('getVideoMetaData', { id, videoPath })
			ipcRenderer.once('getVideoMetaData-reply-' + id, (event, data) => {
				if (data.code !== 0) {
					reject(data)
				} else {
					resolve(data.data)
				}
			})
		})
	},
	videoThumbnail(videoPath, savePath, videoThumbnailName) {
		return new Promise((resolve, reject) => {
			const id = utils.randomId()
			ipcRenderer.send('videoThumbnail', { id, videoPath, savePath, videoThumbnailName })
			ipcRenderer.once('videoThumbnail-reply-' + id, (event, data) => {
				if (data.code !== 0) {
					reject(data)
				} else {
					resolve(data.data)
				}
			})
		})
	},
/*
	saveEmoji(file) {
		return new Promise(async(resolve, reject) => {
			let ext = file.ext || ''
			ext = ext.toLowerCase()
			if (imgExts.indexOf(ext) > -1) {
				const fileName = initFileName(file.ext)
				const fileData = file.data
				const fileLocalPath = path.resolve(remote.getGlobal('userDataPath').emojisPath, fileName)
				const writerStream = fs.createWriteStream(fileLocalPath)
				writerStream.write(fileData, 'base64')
				writerStream.end()
				writerStream.on('finish', async res => {
					resolve(fileLocalPath)
				})
				writerStream.on('error', function(err) {
					resolve({ error: err })
				})
			} else {
				console.log(file)
				resolve({ error: '不支持的图片' })
			}
		})
	},*/
	// 通过sdk下载，图片、表情、语音。cForm为空用于标识添加的表情
	async downloadBySDK({ ext, cForm, url, duration }) {
		const fileName = initFileName(ext)
		let savePath = pathNames[`${cForm}`]
		// cForm为空,是添加的表情
		if (!cForm) {
			savePath = 'emojisPath'
		} else if (cForm === CHAT_MSG_TYPE.TYPE_EMOJI) {
			savePath = pathNames[`${CHAT_MSG_TYPE.TYPE_IMAGE}`]
		}
		const fileLocalPath = path.resolve(this.getGlobalByName('userDataPath')[savePath], fileName)
		let text = ''
		if (cForm == CHAT_MSG_TYPE.TYPE_EMOJI) {
			text = `[${window.i18n.t('common.emoji')}]`
		} else if (cForm === CHAT_MSG_TYPE.TYPE_IMAGE) {
			text = `[${window.i18n.t('common.image')}]`
		} else if (cForm === CHAT_MSG_TYPE.TYPE_VOICE) {
			text = `[${window.i18n.t('common.voice')}]`
		}
		const localData = {
			ext: ext,
			url: url || '',
			cForm: cForm || '',
			text,
			localPath: fileLocalPath
		}
		const downloadData = await chatSdk.cDownloadAsync(url, fileLocalPath)
		const downloadBySDKProgress = (key) => {
			return new Promise(async(resolve, reject) => {
				const tempData = await chatSdk.cDownloadInfo(key)
				let status = null
				if (tempData.length > 4) {
					status = tempData.replace(/^100\,/i, '')
					const response = JSON.parse(status)
					return resolve({ code: 0, data: response })
				} else {
					return resolve({ code: 1 })
				}
			}).then(async res => {
				if (res.code === 0) {
					return Promise.resolve(res.data)
				} else {
					await this.waiting(100)
					return downloadBySDKProgress(key)
				}
			})
		}
		if (downloadData.code === 0) {
			await downloadBySDKProgress(downloadData.data)
			if ([CHAT_MSG_TYPE.TYPE_IMAGE, CHAT_MSG_TYPE.TYPE_EMOJI].includes(cForm) || !cForm) {
				const imageInfo = await this.getImgInfo(fileLocalPath)
				localData.width = imageInfo.width
				localData.height = imageInfo.height
				const { fileSize } = await this.getLocalFIleInfo(fileLocalPath)
				localData.fileSize = fileSize
				if (imageInfo.width === 0 || imageInfo.height === 0) localData.localPath = 'error'
			}
			if (duration !== undefined && duration !== '' && duration !== null) localData.duration = duration
		} else {
			localData.localPath = 'error'
		}
		return Promise.resolve(localData)
	},
	saveFile(file, isSend) { // isSend是否发送者，1是发送者，0是接收者
		const _self = this
		return new Promise(async(resolve, reject) => {
			let cForm
			let text
			let data
			let ext = file.ext || ''
			let savePath = ''
			ext = ext.toLowerCase()
			// 图片、语音需要自动保存，走这里
			if (imgExts.indexOf(ext) > -1 || ext === 'aac') {
				const fileName = initFileName(file.ext)
				const fileData = file.path ? fs.readFileSync(file.path) : file.data

				if (file.cForm && file.cForm == CHAT_MSG_TYPE.TYPE_EMOJI) {
					cForm = file.cForm
					text = `[${window.i18n.t('common.emoji')}]`
					savePath = pathNames[`${CHAT_MSG_TYPE.TYPE_IMAGE}`]
				} else if (imgExts.indexOf(ext) > -1) {
					cForm = CHAT_MSG_TYPE.TYPE_IMAGE
					text = `[${window.i18n.t('common.image')}]`
				} else if (ext === 'aac') {
					if (isSend) { // 不允许发送语音，aac当做文件
						cForm = CHAT_MSG_TYPE.TYPE_FILE
						text = `[${window.i18n.t('common.file')}]`
					} else {
						cForm = CHAT_MSG_TYPE.TYPE_VOICE
						text = `[${window.i18n.t('common.voice')}]`
					}
				}

				const fileLocalPath = path.resolve(remote.getGlobal('userDataPath')[savePath || pathNames[`${cForm}`]], fileName)
				const writerStream = fs.createWriteStream(fileLocalPath)
				writerStream.write(fileData, 'base64')
				writerStream.end()
				writerStream.on('finish', async res => {
					data = {
						ext: file.ext,
						url: file.url || '',
						cForm,
						text,
						localPath: fileLocalPath,
						fileSize: fileData.length
					}
					if (file.duration !== undefined && file.duration !== null && file.duration !== null) data.duration = file.duration
					if ([CHAT_MSG_TYPE.TYPE_IMAGE, CHAT_MSG_TYPE.TYPE_EMOJI].includes(cForm)) {
						const imageInfo = await imageOp.getImageSize('file://' + fileLocalPath)
						// const newImageSize = {}
						/* 交给sdk压缩
						if (ext !== 'gif' && fileData.length > 100000) { // 非动图且图片大于100kb，压缩
							if (imageInfo.width > 1000 || imageInfo.height > 1000) {
								newImageSize = await imageOp.resizeImage(imageInfo.width, imageInfo.height, 1000, 1000)
							}
							let imageBase64 = await imageOp.compressImage('file://' + fileLocalPath, newImageSize)
							imageBase64 = imageBase64.replace(/^data:image\/\w+;base64,/i, '')
							data.fileSize = imageBase64.length
							imageBase64 = Buffer.alloc(imageBase64.length, imageBase64, 'base64')
							fs.writeFileSync(fileLocalPath, imageBase64)
						}*/

						data.width = imageInfo.width
						data.height = imageInfo.height

						if (imageInfo.width === 0 || imageInfo.height === 0) data.localPath = 'error'
					}
					resolve(data)
				})
				writerStream.on('error', function(err) {
					reject(err.stack)
				})
			} else if (videoExts.indexOf(ext) > -1) { // 视频保存走主线程通道
				cForm = CHAT_MSG_TYPE.TYPE_VIDEO
				text = `[${window.i18n.t('common.video')}]`
				const saveThumbnailPath = _self.getGlobalByName('userDataPath').videosPath
				const videoThumbnailName = _self.initFileName('jpg')
				try {
					const { videoThumbnail } = await _self.videoThumbnail(file.path, saveThumbnailPath, videoThumbnailName)
					data = {
						ext: file.ext,
						cForm,
						text,
						thumbnail: videoThumbnail
					}
					const videoMetaData = await _self.getVideoMetaData(file.path)
					data.width = videoMetaData.width
					data.height = videoMetaData.height
					data.duration = videoMetaData.duration
					data.rotation = videoMetaData.rotation
					data.fileSize = file.fileSize
					data.localPath = file.path
					resolve(data)
				} catch (e) {
					// 解码失败的视频，当做文件发送
					cForm = CHAT_MSG_TYPE.TYPE_FILE
					text = `[${window.i18n.t('common.image')}] ` + file.fileName
					data = {
						ext: file.ext,
						url: file.url || '',
						cForm,
						text,
						localPath: file.path,
						fileSize: file.fileSize
					}
					resolve(data)
				}
			} else {
				cForm = CHAT_MSG_TYPE.TYPE_FILE
				text = `[${window.i18n.t('common.file')}] ` + file.fileName
				data = {
					ext: file.ext,
					url: file.url || '',
					cForm,
					text,
					localPath: file.path,
					fileSize: file.fileSize
				}
				resolve(data)
			}
		})
	},

	getLocalFile(path) {
		return new Promise((resolve, reject) => {
			let data = ''
			try {
				data = fs.readFileSync(path)
				console.log(data)
				// const tempExt = getFileExtByPath(path)
				// let ext = tempExt ? tempExt[1] : 'jpg'
				// data = 'data:image/' + ext + ';base64,' + data.toString('base64')
				resolve(data)
			} catch (e) {
				resolve('')
			}
		})
	},

	getLocalImage(path) {
		return new Promise((resolve, reject) => {
			/* const id = new Date().getTime()
			ipcRenderer.send('getLocalImage', { id, path })
			ipcRenderer.once('getLocalImage-reply-' + id, (event, data) => {
				resolve(data)
			})*/
			let data = ''
			try {
				data = fs.readFileSync(path)
				const ext = getFileExtByPath(path)
				data = 'data:image/' + ext + ';base64,' + data.toString('base64')
				resolve(data)
			} catch (e) {
				resolve('')
			}
		})
	},
	getLocalVoice(path) {
		return new Promise((resolve, reject) => {
			/* const id = new Date().getTime()
			ipcRenderer.send('getLocalVoice', { id, path })
			ipcRenderer.once('getLocalVoice-reply-' + id, (event, data) => {
				resolve(data)
			})*/
			let data = fs.readFileSync(path)
			data = 'data:audio/amr;base64,' + data.toString('base64')
			resolve(data)
		})
	},
	getRemoteImage(path) {
		return new Promise((resolve, reject) => {
			const id = utils.randomId()
			ipcRenderer.send('getRemoteImage', { id, path })
			ipcRenderer.once('getRemoteImage-reply-' + id, (event, data) => {
				resolve(data)
			})
		})
	},
	getApiUrlConfig(isGetNew = false) {
		return new Promise((resolve, reject) => {
			ipcRenderer.send('getApiUrlConfig', isGetNew)
			ipcRenderer.once('getApiUrlConfig-reply', (event, data) => {
				resolve(data)
			})
		})
	},
	getHeaders() {
		return new Promise((resolve, reject) => {
			ipcRenderer.send('getHeaders')
			ipcRenderer.once('getHeaders-reply', (event, data) => {
				resolve(data)
			})
		})
	},
	uploadMainLog() {
		return new Promise((resolve, reject) => {
			ipcRenderer.send('uploadMainLog')
			ipcRenderer.once('uploadMainLog-reply', (event, data) => {
				resolve(data)
			})
		})
	}
}
