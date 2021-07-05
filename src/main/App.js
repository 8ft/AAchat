import { app, Menu, ipcMain, BrowserWindow, globalShortcut, dialog, powerMonitor, crashReporter, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { initAppFolder } from './setting'
import Notify from './notify'
import createWin from './createWin'
import Sqlite from './sqlite/'
import apiRouter from './apiRouter'
import chatSdk from './chatSdk'
import Trays from './Trays'
import userResources from './userResources'
import AutoUpdate from './autoUpdate'
import { default as logo } from './logo'
import Axios from './axios'
import request from 'request'
import utils from '../utils/'
import logger from '../utils/logger'
import os from 'os'
// import StreamDownload from './streamDownload'
import WebServer from './webServer/'
import { videoTransCode, videoThumbnail, getVideoMetaData } from './ffmpeg-helper'
import TimeClock from './timeClock'
import AppLang from './appLang'
import { crashReports, crashReportParam } from '~/utils/crashReporter'
const urlFun = require('url')
require('events').EventEmitter.defaultMaxListeners = 50
process.on('uncaughtException', function(err) {
	console.error('uncaughtException@', err)
}) // 监听未捕获的异常

process.on('unhandledRejection', function(err, promise) {
	console.error('unhandledRejection@', err)
}) // 监听Promise没有被捕获的失败函数

export default class App {
	// app对象是否ready1
	_ready = null
	// 托盘图标
	$tray = null
	// 当前窗口
	$currentWin = null
	// 主窗口
	$mainWin = null
	// 图片、视频、文档预览窗口
	$playerWin = null
	// 实时视频窗口
	$realVideoWin = null
	// 实时音频窗口
	$realAudioWin = null
	// 错误窗口
	$errorWin = null
	// 设置窗口
	$settingWin = null
	// 关于窗口
	$aboutWin = null
	// 获取网络配置窗口
	$loadNetConfigWin = null
	// 截图对象
	$screenShot = null
	// 网络情况，默认为null，必须等到页面报告状态
	apiOnline = true // 接口是否在线
	sdkOnline = true // sdk检测是否在线
	online = true // apiOnline && sdkOnline
	locale = ''
	acound = 1
	// 已打开窗口数组
	windowArray = {}
	// app运行目录
	appPath = process.env.NODE_ENV === 'production' ? path.resolve(app.getAppPath(), '..', '..') : path.resolve(app.getPath('appData'), process.env.PROJECT_NAME + '_' + process.env.ENV_CONFIG)
	// 用户数据保存路径
	appUserDataPath = path.resolve(app.getPath('appData'), process.env.NODE_ENV === 'production' ? process.env.PROJECT_NAME : (process.env.PROJECT_NAME + '_' + process.env.ENV_CONFIG))
	// 数据库
	sqliteDb = null
	// 系统设置
	sysConfig = null
	// logs路径
	logsPath = path.join(this.appUserDataPath, 'logs')
	// update路径
	updatePath = path.join(this.appUserDataPath, 'update')
	chatSdk = null
	timeClock = null
	// 是否登录
	isLogin = false
	i18n = {}
	// 未处理消息数
	unreadCount = 0
	// 主窗口是否可见
	windowsVisibility = true
	// api方法
	api = {}
	willQuitApp = false
	// 是否登出
	isLogout = false
	// 登录的用户信息
	accountInfo = null
	// 登录用户的数据目录
	userDataPath = null
	imagesPath = null
	voicesPath = null
	videosPath = null
	otherFilesPath = null
	serverTime = new Date().getTime()
	api_url_config = {}
	// 版本更新信息
	updateVersion = null
	updateApp = null
	axios = null
	webServer = null
	appLang = null
	// tray数据
	trayData = {}
	// 是否第一次get
	isFirstGet = true
	// 是否第一次打开app
	isFirstRun = true
	serverPort = 0
	argvs = process.argv.join(',')
	isTokenOff = false // token是否下线
	// 存储推出的参数
	exitParams = {}
	// 是否退出
	isQuit = false
	winURL = process.env.NODE_ENV === 'development'
		? 'http://localhost:' + process.env.webConfig.DEV_PORT
		: `file://${__dirname}/index.html`

	setting = {
		enableFlicker: true
	}
	// 下载队列
	downloadArray = {}
	constructor() {
		// windows多开参数--secondary
		if (!app.requestSingleInstanceLock() && utils.os.isWindows && this.argvs.indexOf('--secondary') === -1) return app.quit()
		if (process.env.NODE_ENV !== 'development') {
			global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
		}
		// 是否在线
		global.online = true
		// 文件域名
		global.fileDomainURL = ''
		// 笔记域名
		global.notebookHostURL = ''
		global.globalStandardTime = null // 全局时间
		// 应用文件路径
		global.winURL = this.winURL
		global.logsPath = this.logsPath
		// 设备id
		global.deviceId = utils.getDeviceId()
		// 设备类型
		global.deviceType = utils.getDeviceType()
		// 设备系统版本
		global.deviceSystem = utils.getDeviceSystem()
		// 设备系统类型
		global.deviceModel = utils.getDeviceModel()
		// 设备登录名
		global.deviceBrand = os.hostname() + ',' + os.userInfo().username
		initAppFolder(this)()
		app.setPath('temp', this.logsPath)
		logger()
		crashReports()
		this.init().then(async() => {
			powerMonitor.on('suspend', () => {
				console.log('系统休眠')
			})
			powerMonitor.on('resume', () => {
				console.log('系统恢复')
			})
			// 忽略证书相关错误
			app.commandLine.appendSwitch('ignore-certificate-errors')
			app.setAppUserModelId(process.env.appId)
			try {
				if (process.platform === 'darwin') app.dock.setIcon(logo)
			} catch (e) {
				console.error('app.dock.setIcon(logo)')
				console.error(e)
			}
			await this.initSqliteConfigDb()
			// 移除窗口菜单
			Menu.setApplicationMenu(null)
			// 获取系统配置
			await this.getSysConfig()
			this.appLang = new AppLang({ App: this })
			this.appLang.setLocale()
			this.setApiUrlConfig(this.sysConfig.apiUrlConfig)
			// 初始化监听器
			this.initIpcMain()
			// 获取网络配置
			global.appPath = this.appPath
			this.axios = new Axios({ App: this })
			this.initLoadNetConfigWin()
			// 初始化api
			this.api = apiRouter(this)()
			// 初始化sdk
			this.chatSdk = chatSdk(this)()
			this.chatSdk.cLog(this.logsPath)
			this.chatSdk.cHostsAsync(this.api_url_config.im_socket_url)
			this.timeClock = new TimeClock({ App: this })
			// 初始化用户资源监听器
			userResources(this)()
			this.updateApp = new AutoUpdate({ App: this })
			this.webServer = new WebServer({ App: this })
			this.startApp()
			await this.sleep(800) // 等界面加载完成
			this.loopOnlineState()
			console.log('os::', os.hostname())
			console.log('os::', os.userInfo())
			console.log('os::', os.platform())
			console.log('os::', os.release())
			// 检测有没有新版本
			this.api.public.checkVersion({ version: process.env.webConfig.VERSION }).then(async res => {
				this.updateApp.openUpdateWin(res, 'main')
			})
		})
	}
	checkIsOnline() {
		setTimeout(() => {
			console.log('timeout')
			console.log(this.chatSdk.cState())
			this.checkIsOnline()
		}, 1000)
	}

	async startApp() {
		if (!app.requestSingleInstanceLock()) { // 有别的实例在运行的情况下，去掉自动登录。
			await this.setSysConfig({ autoLogin: 'false' })
		}
		this.initTray()
		this.initNotify()
		this.initLoginWin()
		this.initDevToolsShortcut()
		// this.updateApp.exitAutoUpdate()
	}

	// 注册全局监听
	initIpcMain() {
		ipcMain.on('videoThumbnail', (event, params) => {
			videoThumbnail(this)(params.videoPath, params.savePath, params.videoThumbnailName).then(videoMetaData => {
				event.sender.send('videoThumbnail-reply-' + params.id, videoMetaData)
			}).catch(e => {
				event.sender.send('videoThumbnail-reply-' + params.id, e)
			})
		})
		ipcMain.on('getOperationLang', event => {
			event.sender.send('getOperationLang-reply', app.getLocale())
		})
		ipcMain.on('sdkTokenOff', event => {
			this.chatSdk.cTokenOff()
			this.isLogout = true
			event.sender.send('sdkTokenOff-reply')
		})
		ipcMain.on('restartApp', () => {
			this.restartApp()
		})
		ipcMain.on('getVideoMetaData', (event, params) => {
			getVideoMetaData(this)(params.videoPath).then(videoMetaData => {
				event.sender.send('getVideoMetaData-reply-' + params.id, videoMetaData)
			}).catch(e => {
				event.sender.send('getVideoMetaData-reply-' + params.id, e)
			})
		})
		ipcMain.on('videoTransCode', (event, params) => {
			const savePath = path.join(global.userDataPath.videosPath, params.videoFileName)
			videoTransCode(this)(params.videoPath, savePath, (data) => {
				event.sender.send('videoTransCode-reply-' + params.id, data)
			})
		})
		ipcMain.on('deleteAccount', async(e, data) => { // 注销用户，删除用户文件夹和修改系统配置数据库
			try {
				// 删除表
				await this.sqliteDb.dropTable({ tableName: 'threads', db: this.sqliteDb.userDb })
				await this.sqliteDb.dropTable({ tableName: 'messages', db: this.sqliteDb.userDb })
				await this.sqliteDb.dropTable({ tableName: 'collects', db: this.sqliteDb.userDb })
				await this.sqliteDb.dropTable({ tableName: 'userConfig', db: this.sqliteDb.userDb })
				await this.sqliteDb.dropTable({ tableName: 'userInfo', db: this.sqliteDb.userDb })

				await this.clearUserInfo(data.type)

				// 删除文件
				this.delPath(global.userDataPath.root)
				e.sender.send('deleteAccount-reply')
			} catch (error) {
				e.sender.send('deleteAccount-reply', error)
			}
		})
		ipcMain.on('clearUserInfo', async(e) => {
			await this.clearUserInfo()
			e.sender.send('clearUserInfo-reply')
		})
		ipcMain.on('firstGetCompleted', () => {
			this.isFirstGet = false
			this.setTray()
		})
		ipcMain.on('commitUnreadCount', (e, data) => {
			this.trayData = data
			if (!this.isFirstGet) this.setTray()
		})
		ipcMain.on('showMainWin', () => {
			this.showMainWin()
		})
		ipcMain.on('sdk_Online', (event, arg) => {
			this.sdkOnline = arg
			global.online = this.sdkOnline && this.apiOnline
			event.sender.send('mainWinisOnline', global.online)
		})
		ipcMain.on('ditherWin', () => {
			if (this.$mainWin) {
				this.$mainWin.restore()
				this.$mainWin.show()
				this.$mainWin.focus()
				const { x } = this.$mainWin.getBounds()
				const range = 2
				let i = 1
				const timer = setInterval(() => {
					i++
					this.$mainWin.setBounds({ x: i % 2 ? x - range : x + range })
					if (i === 20) clearInterval(timer)
				}, 50)
			}
		})
		ipcMain.on('logout', async(e, param) => {
			this.isLogout = true
			// 退出之前保存主窗口大小
			crashReporter.addExtraParameter('token', '')
			try {
				const { width: mainWinWidth, height: mainWinHeight } = this.$mainWin.getBounds()
				await this.setAccountInfo({ mainWinWidth, mainWinHeight })
				await this.clearUserInfo()
			} catch (e) {}
			this.$mainWin.webContents.send('logout-reply')
		})
		ipcMain.on('exitChat', async(event, param) => {
			await this.quit(param)
			event.sender.send('exitChat-reply')
		})
		ipcMain.on('complateScreenshot', () => {
			if (this.$mainWin && this.$mainWin.isFocused()) { // 截图，主窗口有焦点才回传1
				this.$mainWin.webContents.send('complateScreenshot')
			}
		})
		ipcMain.on('changeWinStyle', (e, args) => {
			this.changeWinStyle(args)
		})
		ipcMain.on('getSysConfig', (event) => {
			event.sender.send('getSysConfig-reply', this.sysConfig)
		})
		ipcMain.on('setSysConfig', async(event, { id, data }) => {
			let sysConfig = ''
			try {
				const tempLang = this.sysConfig.lang
				if (data.telephoneCode) {
					data.telephoneCode = Object.assign({}, this.sysConfig.telephoneCode, data.telephoneCode)
				}
				sysConfig = await this.setSysConfig(data)
				if (data.lang && data.lang !== tempLang) {
					if (this.$playerWin) this.$playerWin.webContents.send('changeLang', data.lang)
					if (this.updateApp.$updateWin) this.updateApp.$updateWin.webContents.send('changeLang', data.lang)
					if (this.$aboutWin) this.$aboutWin.webContents.send('changeLang', data.lang)
					this.appLang.setLocale()
					this.$tray.buildRightMenu()
					this.$tray.buildLeftMenu()
				}
			} catch (e) {
				sysConfig = { code: 0, message: e }
			}
			event.sender.send('setSysConfig-reply-' + id, sysConfig)
		})
		ipcMain.on('setChatLang', async(event, { id, lang }) => {
			await this.setSysConfig({ lang })
			event.sender.send('setSysConfig-reply-' + id)
		})
		ipcMain.on('getAccountInfo', (event) => {
			event.sender.send('getAccountInfo-reply', this.accountInfo)
		})
		ipcMain.on('setAccountInfo', async(event, param) => {
			await this.setAccountInfo(param.data)
			event.sender.send('setAccountInfo-reply-' + param.id)
		})
		ipcMain.on('openLicenseWin', (event, type) => {
			this.initLicenseWin(type)
		})
		ipcMain.on('openAboutWin', (event) => {
			this.openAboutWin()
		})
		ipcMain.on('windowsVisibility', (event, param) => {
			this.windowsVisibility = param
		})
		ipcMain.on('abortDownloadFile', (event, id) => {
			if (this.downloadArray[id]) {
				this.downloadArray[id].downloadItem.cancel()
			}
		})
		ipcMain.on('saveImage', (event, params) => {
			dialog.showSaveDialog(this.$mainWin, {
				title: this.i18n.__('common.saveRoute'),
				defaultPath: params.fileName,
				filters: [
					{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }
				]
			}).then(({ canceled, filePath }) => {
				if (canceled) { // 取消，没有选文件
					event.sender.send('saveImage-reply', { state: 'canceled' })
				} else {
					const writerStream = fs.createWriteStream(filePath)
					writerStream.write(params.data)
					writerStream.end()
					writerStream.on('finish', res => {
						event.sender.send('saveImage-reply', { state: 'success' })
					})
				}
			}).catch(e => {
				event.sender.send('saveImage-reply', { state: 'error', detail: e })
			})
		})
		ipcMain.on('downloadFile', (event, params) => {
			const downloadURL = global.fileDomainURL + params.filePath
			if (params.type === process.env.webConfig.CHAT_MSG_TYPE.TYPE_FILE) {
				dialog.showSaveDialog(this.$mainWin, {
					title: this.i18n.__('common.saveRoute'),
					defaultPath: params.fileName,
					properties: ['openFile', 'openDirectory']
				}).then(({ canceled, filePath, bookmark }) => {
					if (canceled) { // 取消，没有选文件
						event.sender.send('downloadFile-reply-' + params.id, { state: 'canceled' })
					} else {
						this.downloadClass({
							winEvent: event,
							downloadURL,
							saveFilePath: filePath,
							id: params.id,
							type: params.type,
							other: params.other,
							fromType: params.fromType
						})
					}
				})
			} else if (params.type === process.env.webConfig.CHAT_MSG_TYPE.TYPE_VIDEO) {
				const videoFileName = path.basename(params.filePath)
				const saveFilePath = path.join(global.userDataPath.videosPath, videoFileName)
				this.downloadClass({
					winEvent: event,
					saveFilePath,
					downloadURL,
					id: params.id,
					type: params.type,
					other: params.other,
					fromType: params.fromType
				})
			} else {
				event.sender.send('downloadFile-reply-' + params.id, { state: 'error' })
			}
		})
		ipcMain.on('downloadFileBySDK', (event, params) => {
			if (params.type === process.env.webConfig.CHAT_MSG_TYPE.TYPE_FILE) {
				dialog.showSaveDialog(this.$mainWin, {
					title: this.i18n.__('common.saveRoute'),
					defaultPath: params.fileName,
					properties: ['openFile', 'openDirectory']
				}).then(({ canceled, filePath, bookmark }) => {
					if (canceled) { // 取消，没有选文件
						event.sender.send('downloadFileBySDK-reply-' + params.replyId, { state: 'canceled' })
					} else {
						event.sender.send('downloadFileBySDK-reply-' + params.replyId, { saveFilePath: filePath })
					}
				})
			} else if (params.type === process.env.webConfig.CHAT_MSG_TYPE.TYPE_VIDEO) {
				const videoFileName = path.basename(params.filePath)
				const saveFilePath = path.join(global.userDataPath.videosPath, videoFileName)
				event.sender.send('downloadFileBySDK-reply-' + params.replyId, { saveFilePath })
			} else {
				event.sender.send('downloadFileBySDK-reply-' + params.replyId, { state: 'error' })
			}
		})
		ipcMain.on('openImagePlayer', (event, param) => {
			this.openPlayerWin(process.env.webConfig.CHAT_MSG_TYPE.TYPE_IMAGE, param)
		})
		ipcMain.on('openVideoPlayer', (event, param) => {
			this.openPlayerWin(process.env.webConfig.CHAT_MSG_TYPE.TYPE_VIDEO, param)
		})
		ipcMain.on('openFilePlayer', (event, param) => {
			this.openPlayerWin(process.env.webConfig.CHAT_MSG_TYPE.TYPE_FILE, param)
		})
		ipcMain.on('openRealAudioWin', (event, param) => {
			this.openRealAudioWin(param)
		})
		ipcMain.on('openRealVideoWin', (event, param) => {
			this.initRealVideoWin(param)
		})
		ipcMain.on('getVideoStream', (event, param) => {
			this.initRealVideoWin()
			this.$realVideoWin.webContents.send('getVideoStream', param.stream)
			event.sender.send('getVideoStream-reply-' + param.id)
		})
		ipcMain.on('playerWin', (event, data) => {
			switch (data.opType) {
				case 'setPlayerWin':
					if (data.playerType === process.env.webConfig.CHAT_MSG_TYPE.TYPE_FILE && data.messageId === this.$playerWin.webContents.browserWindowOptions.messageId) {
						this.$playerWin.webContents.send('setPlayerWin', data)
					}
					break
				case 'changePlayerId':
					this.$playerWin.webContents.browserWindowOptions.senderId = data.senderId
					this.$playerWin.webContents.browserWindowOptions.messageId = data.messageId
					this.$playerWin.webContents.send('changePlayerMessageId', data.messageId)
					break
				case 'share':
					this.showMainWin()
				// eslint-disable-next-line no-fallthrough
				default:
					this.$mainWin.webContents.send('playerWin', data)
			}
		})
		ipcMain.on('closePlayerWin', (event, { messageId = '', threadId = '', senderId = '', deleteType = '', groupName = '' }) => {
			if (this.$playerWin) {
				if ((this.$playerWin.webContents.browserWindowOptions.threadId === threadId &&
					(!senderId || this.$playerWin.webContents.browserWindowOptions.senderId === senderId) &&
					(!messageId || messageId === 'all' || this.$playerWin.webContents.browserWindowOptions.messageId === messageId)) ||
					(deleteType === 'destroyUserId' && this.$playerWin.webContents.browserWindowOptions.senderId === senderId)) {
					this.$playerWin.webContents.send('delete', { deleteType, groupName })
					this.$playerWin.show()
					this.$playerWin.focus()
				}
			}
			/* if (this.$imagePlayerWin &&
				this.$imagePlayerWin.webContents.browserWindowOptions.threadId === threadId &&
				(!senderId || this.$imagePlayerWin.webContents.browserWindowOptions.senderId === senderId) &&
				(!messageId || messageId === 'all' || this.$imagePlayerWin.webContents.browserWindowOptions.messageId === messageId)
			) {
				this.$imagePlayerWin.webContents.send('delete')
				this.$imagePlayerWin.show()
				this.$imagePlayerWin.focus()
			}
			if (this.$videoPlayerWin &&
				this.$videoPlayerWin.webContents.browserWindowOptions.threadId === threadId &&
				(!senderId || this.$videoPlayerWin.webContents.browserWindowOptions.senderId === senderId) &&
				(!messageId || messageId === 'all' || this.$videoPlayerWin.webContents.browserWindowOptions.messageId === messageId)
			) {
				this.$videoPlayerWin.webContents.send('delete')
				this.$videoPlayerWin.show()
				this.$videoPlayerWin.focus()
			}
			if (this.$filePlayerWin &&
				this.$filePlayerWin.webContents.browserWindowOptions.threadId === threadId &&
				(!senderId || this.$filePlayerWin.webContents.browserWindowOptions.senderId === senderId) &&
				(!messageId || messageId === 'all' || this.$filePlayerWin.webContents.browserWindowOptions.messageId === messageId)
			) {
				this.$filePlayerWin.webContents.send('delete')
				this.$filePlayerWin.show()
				this.$filePlayerWin.focus()
			}*/
		})
		ipcMain.on('getApiUrlConfig', (event, isGetNew) => {
			// isGetNew用于是否更新网络配置并返回,
			if (isGetNew) {
				this.axios.getNetConfig().then(res => {
					const	currentConfig	=	JSON.stringify(this.api_url_config)
					this.setApiUrlConfig(res.data)
					this.sqliteDb.setConfig({ apiUrlConfig: res.data })
					event.sender.send('getApiUrlConfig-reply', {
						currentConfig: JSON.parse(currentConfig),
						newConfig: res.data
					})
				}).catch(e => {
					console.error('getNetConfig@', e)
					event.sender.send('getApiUrlConfig-reply', { error: e })
				})
			}	else {
				event.sender.send('getApiUrlConfig-reply', { currentConfig: this.api_url_config })
			}
		})
		ipcMain.on('getHeaders', (event, param) => {
			const	headers = {
				token: this.accountInfo.token,
				organ_id: this.accountInfo.organId,
				lang: this.locale,
				api_url: this.api_url_config.api_url,
				app_var: process.env.webConfig.VERSION,
				device_type: global.deviceType,
				device_system: global.deviceSystem,
				device_model: global.deviceModel,
				device_brand: global.deviceBrand,
				device_id: global.deviceId,
				client_type: process.env.webConfig.client_type,
				api_version: process.env.webConfig.api_version,
				'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
			}
			event.sender.send('getHeaders-reply', headers)
		})
		ipcMain.on('uploadMainLog', (event) => {
			const	today	=	utils.formatDate(new Date())
			const	logPath	=	path.join(this.logsPath, `${today}.main.log`)
			fs.readFile(logPath, async(err, data) => {
				const	baseParams = Object.assign({}, crashReportParam(), {
					fromType: 'pc',
					token: this.accountInfo.token || '',
					device_id: global.deviceId,
					lang: this.locale
				})
				if (data) {
					const FormStream = require('formstream')
					const form = FormStream()
					form.buffer('file', data, `${today}.main.log`)
					for (var key in baseParams) {
						form.field(key, baseParams[key])
					}
					const upload = request.post(process.env.webConfig.crashReportServer, {
						headers: form.headers()
					}, (req, res) => {
						let	result = {}
						try {
							result = JSON.parse((res && res.body) || '{code: 789789, message: "请求异常"}')
						}	catch (err) {
							result = { code: 789789, message: err }
						}
						result.url = process.env.webConfig.crashReportServer
						event.sender.send('uploadMainLog-reply', result)
					})
					form.pipe(upload)
				} else if (err)	{
					event.sender.send('uploadMainLog-reply', { code: 0, message: '暂无主线程日志' })
				}
			})
		})
	}
	restartApp() {
		console.log('restart app')
		app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
		app.quit()
	}
	downloadClass({ winEvent, id, saveFilePath, type, other, fromType, downloadURL }) {
		if (this.downloadArray[id]) return
		this.downloadArray[id] = {}
		this.downloadArray[id].view = new BrowserWindow({
			show: false,
			webPreferences: {
				partition: id + new Date().getTime(),
				devTools: false
			}
		})
		this.downloadArray[id].view.webContents.session.on('will-download', (event, item, webContents) => {
			if (this.downloadArray[id].downloadItem)	{
				this.downloadArray[id].downloadItem.cancel && this.downloadArray[id].downloadItem.cancel()
				delete this.downloadArray[id].downloadItem
			}
			this.downloadArray[id].downloadItem = item
			item.setSavePath(saveFilePath)
			item.on('updated', (event, state) => {
				// 備注：interrupted中斷狀態
				winEvent.sender.send('downloadFile-reply-' + id, {
					state: state === 'progressing' ? 'progress' : state,
					totalBytes: item.getTotalBytes(),
					receivedBytes: item.getReceivedBytes(),
					id, saveFilePath, type, other, fromType
				})
			})
			item.once('done', (event, state) => {
				winEvent.sender.send('downloadFile-reply-' + id, {
					state: state === 'completed' ? 'finished' : (state === 'cancelled' ? 'abort' : state),
					totalBytes: item.getTotalBytes(),
					receivedBytes: item.getReceivedBytes(),
					id, saveFilePath, type, other, fromType
				})
				if (this.downloadArray[id]) {
					this.downloadArray[id].view.destroy()
					delete this.downloadArray[id].view
					delete this.downloadArray[id].downloadItem
					delete this.downloadArray[id]
				}
				console.log('this.downloadArray:::', this.downloadArray)
			})
		})
		this.downloadArray[id].view.webContents.downloadURL(downloadURL)
		/* if (!saveFilePath) return1
		const downloadFun = new StreamDownload()
		// 处理打开多个下载框时，多次下载同一文件以最后下载为准
		if (this.downloadArray[listenerId])	{
			this.downloadArray[listenerId].abort && this.downloadArray[listenerId].abort()
		}
		this.downloadArray[listenerId] = downloadFun
		downloadFun.downloadFile(downloadURL, saveFilePath, (state, { totalBytes, receivedBytes }) => {
			event.sender.send('downloadFile-reply-' + listenerId, { state, totalBytes, receivedBytes, saveFilePath })
		})*/
	}
	async setAccountInfo(data) {
		if (data.nickName) {
			if (this.$tray) this.$tray.setToolTip(data.nickName)
			if (this.$mainWin) this.$mainWin.setTitle(data.nickName + ' - ' + process.env.PROJECT_NAME)
		}
		await this.sqliteDb.setAccountInfo(data)
		this.accountInfo = Object.assign({}, this.accountInfo || {}, data)
		return Promise.resolve()
	}
	setTray() {
		try {
			const count = this.trayData.unProcessCount || 0
			this.unreadCount = count
			this.$tray.setLeftMenu(this.trayData.unreadThreads || [], this.trayData.newFriendNum)
			this.$tray.flicker(count)
			if (process.platform === 'darwin') app.dock.setBadge(count ? (count > 99 ? '99+' : count.toString()) : '')
		} catch (e) {}
	}

	getSysConfig() {
		return new Promise(async(resolve, reject) => {
			try {
				const config = await this.sqliteDb.getConfig()
				if (!config.data) config.data = {}
				if (config.data.appEnv !== process.env.webConfig.ENV_CONFIG + '_' + process.env.webConfig.PROJECT_NAME || config.data.appVersion !== process.env.webConfig.VERSION) {
					const params = {
						appEnv: process.env.webConfig.ENV_CONFIG + '_' + process.env.webConfig.PROJECT_NAME,
						// apiUrlConfig: process.env.webConfig.APIURLCONFIG,
						appVersion: process.env.webConfig.VERSION
					}
					await this.sqliteDb.setConfig(params)
					config.data = Object.assign({}, config.data, params)
				}
				this.sysConfig = config.data
				resolve()
			} catch (e) {
				reject(e)
			}
		})
	}

	changeWinStyle(args) {
		if (!this.$mainWin) return
		const params = {
			resizable: true,
			hasShadow: true,
			// backgroundColor: 'rgba(255, 255, 255, 1)',
			minWidth: 1,
			minHeight: 1
		}
		let tempParams = null
		this.$mainWin.hide()
		switch (args.path) {
			case '/login':
				tempParams = {
					// title: this.i18n.__('login.loginBtn'),
					height: 640,
					width: 1060,
					resizable: false
				}
				if (this.$tray) this.$tray.setToolTip()
				// 注销截图快捷键
				globalShortcut.unregister('ctrl+shift+a')
				// 在登录界面重置网路状态为在线，避免登录界面调接口报错1
				global.online = true
				this.$mainWin.webContents.send('mainWinisOnline', global.online)
				break
			case '/chat':
				crashReporter.addExtraParameter('token', this.accountInfo && this.accountInfo.token ? this.accountInfo.token : '')
				tempParams = {
					title: this.accountInfo.nickName,
					width: this.accountInfo.mainWinWidth || process.env.webConfig.DEFAULT_MAINWIN_WIDTH,
					height: this.accountInfo.mainWinHeight || process.env.webConfig.DEFAULT_MAINWIN_HEIGHT,
					minWidth: process.env.webConfig.DEFAULT_MAINWIN_WIDTH,
					minHeight: process.env.webConfig.DEFAULT_MAINWIN_HEIGHT,
					maximizable: true
				}
				// 耗资源，延时2秒运行
				setTimeout(() => {
					if (this.isFirstRun) {
						this.isFirstRun = false
						// this.openRealAudioWin()
						this.openPlayerWin(process.env.webConfig.CHAT_MSG_TYPE.TYPE_IMAGE, {}) //  先打开图片浏览器窗口并隐藏，加快打开图片时候的速度
						// this.openPlayerWin('video', {}) //  先打开视频播放器窗口并隐藏，加快打开视频时候的速度
						// this.openPlayerWin('file', {}) //  先打开文件预览窗口并隐藏，加快打开文件预览时候的速度
					}
				}, 2000)
				if (this.$tray) this.$tray.setToolTip(tempParams.title)
				// 注册截图快捷键
				globalShortcut.register('ctrl+shift+a', () => {
					this.$mainWin.webContents.send('screenShot')
				})
				// 在登录界面重置网路状态为在线，避免登录界面调接口报错1
				global.online = true
				this.$mainWin.webContents.send('mainWinisOnline', global.online)
		}
		if (!tempParams) return
		const winParams = Object.assign({}, params, tempParams || {}, args.params || {})
		if (winParams.title) {
			this.$mainWin.setTitle(winParams.title + ' - ' + process.env.PROJECT_NAME)
		} else {
			this.$mainWin.setTitle(process.env.PROJECT_NAME)
		}
		this.$mainWin.setHasShadow(winParams.hasShadow)
		this.$mainWin.setResizable(winParams.resizable)
		if (winParams.minHeight && winParams.minWidth) this.$mainWin.setMinimumSize(winParams.minWidth, winParams.minHeight)
		if (winParams.maximizable === undefined) winParams.maximizable = false
		this.$mainWin.setMaximizable(winParams.maximizable)
		this.$mainWin.setBounds({ width: winParams.width, height: winParams.height })
		// this.$mainWin.setBackgroundColor(winParams.backgroundColor)
		this.$mainWin.center()
		this.$mainWin.show()
	}
	setSysConfig(data) {
		return new Promise((resolve, reject) => {
			this.sqliteDb.setConfig(data).then(res => {
				this.getSysConfig().then(res1 => {
					resolve(res1)
				}).catch(e1 => {
					reject(e1)
				})
			}).catch(e => {
				reject(e)
			})
		})
	}

	// 删除目录
	delPath(path) {
		if (!fs.existsSync(path)) {
			return
		}
		var info = fs.statSync(path)
		if (info.isDirectory()) { // 目录
			var data = fs.readdirSync(path)
			if (data.length > 0) {
				for (var i = 0; i < data.length; i++) {
					this.delPath(`${path}/${data[i]}`) // 使用递归
				}
			}
		} else if (info.isFile()) {
			fs.unlink(path, () => {})// 删除文件
		}
	}

	// 获取窗口名称2
	getWinName($win) {
		return $win.webContents.browserWindowOptions.name
	}

	// 清空用户登录信息
	clearUserInfo(type) {
		return new Promise(async(resolve, reject) => {
			try {
				this.isFirstGet = true
				this.resetTrayMenu()

				if (this.chatSdk) await this.chatSdk.cTokenOff()
				if (this.accountInfo) this.accountInfo = {}

				if (type !== 'kill' && type !== 'quit') {
					await this.sqliteDb.setAccountInfo({ token: '', p: '', organId: '' })
				}

				const data = {
					autoLogin: 'false',
					lastLogin: ''
				}
				if (type === 'kill') data.loginName = ''
				await this.setSysConfig(data)

				this.sqliteDb.closeUserDB()
				if (this.$playerWin) this.$playerWin.close()
				if (this.$realAudioWin) this.$realAudioWin.close()
				resolve()
			} catch (e) {
				console.error('clearUserInfo@', e)
				resolve()
			}
		})
	}
	setApiUrlConfig(data) {
		if (!data || !data.im_file_url || !data.api_url || !data.im_socket_url) return
		// if (data.im_socket_url !== this.api_url_config.im_socket_url && this.chatSdk) this.chatSdk.cHostsAsync(this.api_url_config.im_socket_url)
		this.api_url_config = {
			...data
		}
		let downloadDomain
		if (this.api_url_config.im_file_url) {
			downloadDomain = this.api_url_config.im_file_url
		} else {
			downloadDomain = this.api_url_config.im_socket_url.split(',')[0]
			if (downloadDomain.toLowerCase().indexOf('http://') > -1 || downloadDomain.toLowerCase().indexOf('https://') > -1) {
				downloadDomain = urlFun.parse(downloadDomain).hostname
			}
			downloadDomain = `http://${downloadDomain}:16690`
		}
		global.fileDomainURL = downloadDomain
		global.notebookHostURL = this.api_url_config.notebook_host_url
		if (this.api_url_config.api_url.substr(this.api_url_config.api_url.length - 1, this.api_url_config.api_url.length) === '/') this.api_url_config.api_url = this.api_url_config.api_url.substr(0, this.api_url_config.api_url.length - 1)
		console.log('this.api_url_config:::::', this.api_url_config)
	}
	/**
	 * 初始化
	 * @return {Promise} setting
	 */
	async init() {
		// 重复打开应用就显示窗口
		if (utils.os.isWindows && this.argvs.indexOf('--secondary') === -1) app.on('second-instance', (event, commandLine, workingDirectory) => this.showMainWin())
		app.on('will-quit', async(e) => {
			// e.preventDefault()
			console.log('will-quit')
		})
		// 开始关闭窗口前调用
		app.on('before-quit', async(e) => {
			if (this.willQuitApp) {
				console.log(2, 'before-quit')
			} else {
				console.log(1, 'before-quit')
				e.preventDefault()
				this.willQuitApp = true
				const doQuit = async() => {
					this.isQuit = true
					this.isLogout = true
					if (process.platform !== 'darwin') {
						if (this.$tray && !this.$tray.isDestroyed()) {
							this.$tray.destroy()
							this.$tray = null
						}
					}
					// 关闭web服务器
					if (this.webServer) {
						this.webServer.closeServer()
						this.webServer = null
					}
					// 关闭数据里连接
					if (this.sqliteDb) {
						this.sqliteDb.close()
						this.sqliteDb = null
					}
					// 注销所有快捷键
					globalShortcut.unregisterAll()
					if (this.timeClock) this.timeClock.stopTimer() // 停止计时
					await this.sleep(500)
					app.quit()
				}
				this.exitParams.sendNotice = this.exitParams.sendNotice === undefined ? true : this.exitParams.sendNotice // 默认通知APP
				if (this.exitParams.sendNotice && global.online && this.accountInfo && this.accountInfo.token) {
					this.api.user.directEnterOrQuit({ type: '1', custError: true }).then(res => {
						doQuit()
					}).catch(e => doQuit())// 通知APP
				} else {
					doQuit()
				}
			}
		})
		app.on('quit', async(e) => {
			console.log('quit')
		})
		app.on('gpu-process-crashed', () => {
			console.error('GPU进程崩溃，程序退出')
			app.exit(0)
		})
		app.on('renderer-process-crashed', (event, webContents, killed) => {
			console.error('killed:::::::', killed)
		})
		app.on('activate', () => {
			this.showMainWin()
		})
		return app.whenReady()
	}

	// 初始化配置数据库
	initSqliteConfigDb() {
		return new Promise((resolve, reject) => {
			this.sqliteDb = new Sqlite({ App: this })
			this.sqliteDb.initConfigDb().then(res => {
				resolve()
			}).catch(e => {
				reject(e)
			})
		})
	}

	// 打开实时音频窗口
	async openRealAudioWin(params = {}) {
		if (!this.$realAudioWin) {
			this.$realAudioWin = createWin(this)({
				name: 'realAudio',
				frame: false,
				width: 425,
				height: 170,
				resizable: false,
				initShow: false,
				closeCurrentType: 'hidden',
				webPreferences: {
					webSecurity: false
				},
				winURL: '/realAudio'
			})
		} else {
			this.$realAudioWin.show()
			this.$realAudioWin.focus()
			this.$realAudioWin.webContents.send('params', params)
		}
	}
	// 初始化实时视频窗口
	initRealVideoWin() {
		if (this.$realVideoWin) {
		} else {
			this.$realVideoWin = createWin(this)({
				name: 'realVideo',
				frame: false,
				width: 968,
				height: 725,
				resizable: false,
				winURL: '/realVideo'
			})
		}
	}

	// 初始化网络加载界面
	initLoadNetConfigWin() {
		/* const width = 200
		const height = 200
		this.$loadNetConfigWin = createWin(this)({
			name: 'loadNetConfig',
			frame: false,
			width,
			height,
			maxWidth: width,
			maxHeight: height,
			titleBarStyle: 'customButtonsOnHover',
			winURL: '/loadNetConfig',
			transparent: true,
			resizable: false,
			hasShadow: false,
			maximizable: false
		})*/
		this.axios.getNetConfig().then(async res => {
			console.log('getNetConfig:::', res)
			if (JSON.stringify(res.data) !== JSON.stringify(this.api_url_config)) {
				if (res.data.im_socket_url !== this.api_url_config.im_socket_url) {
					this.chatSdk.cHostsAsync(res.data.im_socket_url)
				}
				this.setApiUrlConfig(res.data)
				await this.setSysConfig({ apiUrlConfig: res.data })
				/* const interval = setInterval(() => {
					// mainwin加载完成且可见才调用弹窗
					if (this.$mainWin && this.$mainWin.isVisible()) {
						clearInterval(interval)
						dialog.showMessageBox(this.$mainWin, {
							type: 'info',
							buttons: [this.i18n.__('common.restart'), this.i18n.__('common.exitIM')],
							defaultId: 0,
							message: this.i18n.__('common.updateConfigTip')
						}).then(({ response: index }) => {
							if (index === 0) {
								this.restartApp()
							} else {
								this.quit()
							}
						})
					}
				}, 100)*/
			}
		}).catch(e => {
			console.error('getNetConfig@', e)
		})
	}
	sleep(time) {
		return new Promise(resolve => setTimeout(resolve, time))
	}
	// 轮询网络状态
	async loopOnlineState() {
		let apiOnline = true
		// console.log('::::::::loopOnLineState::::::::')
		try {
			const res = await this.axios.get('/health', { timeout: 30000 })
			apiOnline = res.status === 'UP'
		} catch (e) {
			console.error('loopOnlineState1@', e.toString())
			apiOnline = false
		}
		this.apiOnline = apiOnline
		global.online = this.apiOnline && this.sdkOnline
		if (this.$mainWin) this.$mainWin.webContents.send('mainWinisOnline', global.online)
		await this.sleep(2000)
		this.loopOnlineState()
	}
	/*
	loopOnlineState() {
		return new Promise(async(resolve, reject) => {
			// global.isonline = true
			try {
				await this.$mainWin.webContents.send('mainWinisOnline', global.online)
				const checkApiNet = () => {
					if (this.isLogout) return
					this.acound = 2
					return this.axios.get('/health').then(async res1 => {
						if (global.online != (res1.status === 'UP')) {
							global.online = res1.status === 'UP'
							await this.$mainWin.webContents.send('mainWinisOnline', global.online)
						}
						await this.sleep(2000)
						return checkApiNet()
					}).catch(async e => {
						global.online = false
						await this.$mainWin.webContents.send('mainWinisOnline', global.online)
						await this.sleep(2000)
						return checkApiNet()
					})
				}
				await checkApiNet()
			} catch (e) {
				if (this.acound <= 4) {
					this.acound++
					this.loopOnlineState()
				}
				console.error('loopOnlineState@', e)
			}
		})
	}*/
	async openPlayerWin(type, payload = {}) {
		const playerID = utils.md5((payload.filePath || '') + (payload.timestamp || '') + (payload.url || ''))
		const senderId = payload.senderId || ''
		const messageId = payload.messageId || ''
		const threadId = payload.threadId || ''
		if (this.$playerWin) {
			if (this.$playerWin.webContents.browserWindowOptions.playerID === playerID) {
				if (this.$playerWin.isMinimized()) this.$playerWin.restore()
				this.$playerWin.show()
				this.$playerWin.focus()
				return
			} else {
				this.$playerWin.close()
				this.$playerWin.setBounds({ width: 1100, height: 640 })
				this.$playerWin.webContents.browserWindowOptions.playerID = playerID
				this.$playerWin.webContents.browserWindowOptions.senderId = senderId
				this.$playerWin.webContents.browserWindowOptions.messageId = messageId
				this.$playerWin.webContents.browserWindowOptions.threadId = threadId
				payload.playerType = type
				console.log('payload.playerType::', payload.playerType)
				this.$playerWin.webContents.send('params', payload)
			}
		} else {
			const option = {
				name: type + 'Player',
				frame: false,
				closeCurrentType: 'hidden',
				minWidth: 880,
				minHeight: 600,
				width: 1100,
				height: 640,
				webPreferences: {
					webSecurity: false,
					partition: 'filePlayer'
				},
				maximizable: true,
				initShow: false,
				winURL: `/player`

			}
			if (utils.os.isMac) option.titleBarStyle = 'hidden'
			this.$playerWin = await createWin(this)(option)
			this.$playerWin.webContents.session.webRequest.onBeforeRequest((detail, callback) => {
				const { url, method, resourceType, referrer } = detail
				if (['mainFrame', 'subFrame'].indexOf(resourceType) > -1 && method === 'GET' && referrer && !referrer.startsWith('file://') && !referrer.startsWith('http://localhost')) {
				  shell.openExternal(url)
				} else {
					callback({})
				}
			})
		}
	}

	// 初始化登录窗口
	async initLoginWin() {
		this.$mainWin = await createWin(this)({
			name: 'main',
			// title: this.i18n.__('login.loginBtn'),
			height: 640,
			width: 1060,
			resizable: false,
			frame: false,
			winURL: '/login',
			closeCurrentType: 'hidden',
			transparent: !utils.os.isMac,
			webPreferences: {
				webSecurity: false
			},
			closeWindows: ['loadNetConfig']
		})
	}

	// 初始化用户协议窗口
	initLicenseWin(type) {
		createWin(this)({
			name: 'license',
			title: type == 1 ? this.i18n.__('common.privacyTitle') : this.i18n.__('common.serviceAgreement'),
			height: 500,
			width: 800,
			resizable: false,
			winURL: '/license?type=' + type,
			menu: false,
			maximizable: false,
			parent: this.$mainWin,
			modal: process.platform !== 'darwin'
		})
	}

	async openAboutWin() {
		if (this.$aboutWin) return
		this.$aboutWin = await createWin(this)({
			name: 'about',
			title: this.i18n.__('common.aboutIM'),
			height: 350,
			width: 420,
			resizable: false,
			winURL: '/about',
			maximizable: false,
			minimizable: false,
			menu: false,
			parent: this.$mainWin,
			modal: process.platform !== 'darwin'
		})
	}

	// 从数据库取用户信息
	getAccountInfo() {
		return new Promise((resolve, reject) => {
			this.sqliteDb.getAccountInfo().then(res => {
				this.accountInfo = res.data
				resolve(res)
			})
		})
	}

	/**
	 * 初始化托盘图标
	 */
	initTray() {
		this.$tray = new Trays({ App: this })
	}

	/**
	 * 初始化消息提示
	 */
	initNotify() {
		this.$notify = new Notify({ App: this })
		ipcMain.on('notify', (e, body) => {
			console.log('this.windowsVisibility:', this.windowsVisibility)
			if (process.platform === 'win32') this.$mainWin.flashFrame(true)
			if (!this.windowsVisibility) {
				this.$mainWin.flashFrame(true)
				this.$notify.show(body)
			}
		})
		this.$notify.on('click', (e) => {
			this.$mainWin.webContents.send('open-chat-window', e)
			// this.showMainWin()
		})
	}

	/**
	 * 初始化自定义快捷键
	 *  ctrl+d：打开控制台
	 */
	initDevToolsShortcut() {
		globalShortcut.register('ctrl+shift+alt+z+enter', () => {
			try {
				this.$currentWin.webContents.openDevTools({ mode: 'detach' })
			} catch (e) {
				this.$mainWin.webContents.openDevTools({ mode: 'detach' })
			}
		})
	}

	/**
	 * 退出应用
	 */
	async quit(param = {}) {
		this.exitParams = param
		try {
			if (this.sqliteDb.userDb && this.$mainWin) {
				// 退出之前保存主窗口大小
				const { width: mainWinWidth, height: mainWinHeight } = this.$mainWin.getBounds()
				await this.setAccountInfo({ mainWinWidth, mainWinHeight })
			}
			app.quit()
			await this.sleep(5000) // 用于修复页面关闭但chatsdk还在请求的问题，等chatsdk关闭后才关闭页面
			return Promise.resolve()
		} catch (e) {
			console.error('App,quit')
			console.error(e)
			app.exit()
		}
	}

	/**
	 * 绑定快捷键
	 */
	/* bindShortcut () {
			shortcut(this)()
	}*/

	// 显示所有窗口
	showAllWin() {
		const windows = BrowserWindow.getAllWindows()
		windows.forEach(item => item.show())
	}

	/**
	 * 显示主窗口
	 */
	showMainWin() {
		if (this.$mainWin) {
			try {
				if (process.platform === 'win32') this.$mainWin.setSkipTaskbar(false)
				if (this.$mainWin.isMinimized()) this.$mainWin.restore()
				this.$mainWin.show()
				this.$mainWin.focus()
			} catch (e) {
				if (this.$currentWin.isMinimized()) this.$currentWin.restore()
				this.$currentWin.show()
				this.$currentWin.focus()
			}
		}
	}

	/**
	 * 显示邮箱窗口
	 * @param {Object} storage
	 */

	/* showEmailWin (storage) {
			this.$emailWin = emailWin(this)(storage)
	}*/

	/**
	 * 显示错误窗口
	 */
	showErrorWin() {
		// this.$errorWin = errorWin(this)()
	}

	/**
	 * 隐藏错误窗口
	 */
	hideErrorWin() {
		if (this.$errorWin) {
			this.$errorWin.close()
		}
	}

	/**
	 * 显示设置窗口
	 */

	/* showSettingWin () {
			this.$settingWin = settingWin(this)()
	}*/

	/**
	 * 关闭设置窗口
	 */
	hideSettingWin() {
		if (this.$settingWin) {
			this.$settingWin.close()
		}
	}

	resetTrayMenu() {
		if (this.$tray && !this.$tray.isDestroyed()) {
			this.trayData = {}
			this.setTray()
		}
	}

	/**
	 * 显示关于窗口
	 */
	showAboutWin() {
		// this.$aboutWin = aboutWin(this)()
	}
}
