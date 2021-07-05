import contextMenu from './contextMenu'
import path from 'path'
import { BrowserWindow, globalShortcut, dialog } from 'electron'
import logo from './logo'
import _ from 'lodash'

// let lastUrl
// let time = Date.now()

/**
 * 打开外部链接
 * @param {String} url
 */
/* function openExternal(url) {
  // 防止短时间快速点击链接
  if (lastUrl === url && Date.now() - time < 800) return
  lastUrl = url
  time = Date.now()
  shell.openExternal(url)
}*/
export const createWindow = App => async option => {
	const windowName = option.name || option.winURL || 'main'
	const defaultOption = {
		title: process.env.PROJECT_NAME,
		name: 'default',
		height: process.env.webConfig.DEFAULT_MAINWIN_HEIGHT,
		// useContentSize: true,
		width: process.env.webConfig.DEFAULT_MAINWIN_WIDTH,
		// center: true, // 设置为true反而不居中，先注释了ƒ
		icon: logo,
		initShow: true, //  初始化后是否显示
		resizable: true,
		webPreferences: {
			partition: windowName,
			nodeIntegration: false, // 是否完整的支持 node. 默认值为true，设为false提高安全性
			nodeIntegrationInWorker: false, // 是否在Web工作器中启用了Node集成
			preload: process.env.NODE_ENV === 'production' ? path.join(App.appPath, 'resources', 'renderProcessApi.js') : path.resolve('.', __dirname, 'renderProcessApi.js')
			// devTools: true,
			// webSecurity: false
		},
		maximizable: false, // 设为false可以禁用拖动条双击放大，
		show: false,
		closeWindows: [],
		closeCurrentType: 'close' // 关闭当前窗口的方式，hidden隐藏，close关闭, warning弹出警告
	}
	option.title = option.title ? option.title + ' - ' + defaultOption.title : defaultOption.title
	option = _.defaultsDeep(option, defaultOption)
	let $win = new BrowserWindow(option)
	let url = App.winURL
	if (option.winURL && option.winURL.toLowerCase().indexOf('http') === 0) {
		url = option.winURL
	} else {
		url += `#${option.winURL}`
	}
	$win.loadURL(url)
	$win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders['token'] = !App.accountInfo ? '' : App.accountInfo.token
		details.requestHeaders['app_var'] = process.env.webConfig.VERSION
		details.requestHeaders['device_type'] = global.deviceType
		details.requestHeaders['device_system'] = global.deviceSystem
		details.requestHeaders['device_model'] = global.deviceModel
		details.requestHeaders['device_brand'] = global.deviceBrand
		details.requestHeaders['device_id'] = global.deviceId
		details.requestHeaders['client_type'] = process.env.webConfig.client_type
		details.requestHeaders['api_version'] = process.env.webConfig.api_version
		callback({ cancel: false, requestHeaders: details.requestHeaders })
	})
	if (process.env.NODE_ENV !== 'production') $win.webContents.openDevTools({ mode: 'detach' })
	const closeWinFun = (e) => {
		if (App.willQuitApp) {
			console.log('close::::', `$${option.name}Win`)
			$win = null
			if (App[`$${option.name}Win`] !== null) App[`$${option.name}Win`] = null
			return
		}
		try {
			if (option.closeCurrentType === 'hidden') {
				e.preventDefault()
				if (option.name.indexOf('Player') > -1) { // 窗口播放器要做的操作
					$win.webContents.send('close')
					if ($win.isFullScreen() && process.platform === 'darwin') {
						setTimeout(() => {
							$win.hide()
						}, 1000)
						$win.setFullScreen(false)
					} else {
						$win.hide()
					}
					$win.webContents.browserWindowOptions.playerID = ''
					$win.webContents.browserWindowOptions.senderId = ''
					$win.webContents.browserWindowOptions.messageId = ''
					$win.webContents.browserWindowOptions.threadId = ''
				} else {
					if (process.platform === 'win32') {
						if (App.windowsVisibility) {
							$win.hide()
						} else {
							$win.setSkipTaskbar(true)
						}
					} else {
						$win.hide()
					}
				}
			} else if (option.closeCurrentType === 'close') {
				$win = null
				if (App[`$${option.name}Win`] !== null) App[`$${option.name}Win`] = null
			} else if (option.closeCurrentType === 'warning') {
				e.preventDefault()
				option.warningCallBack()
			}
		} catch (e) {
			console.error(`window-close@${option.name}:`, e)
		}
	}
	/**
	 * 窗体关闭事件处理
	 * 默认只会隐藏窗口
	 */
	$win.on('close', e => {
		closeWinFun(e)
	})
	$win.webContents.on('crashed', (event, killed) => {
		const options = {
			type: 'error',
			title: '进程崩溃',
			message: process.env.PROJECT_NAME + '进程已经崩溃.',
			buttons: ['关闭']
		}
		console.error('renderer:crash:killed@', killed)
		console.error('renderer:crash:event@', event)
		dialog.showMessageBox(options).then(({ response: index }) => {
			if (index === 0) {
				// app.relaunch()
				App.quit()
			} else {
				App.quit()
			}
		})
	})
	$win.on('resize', e => {
		console.log('resizeresize')
	})
	$win.on('maximize', e => {
		$win.webContents.send('isMaxWin', true)
	})
	$win.on('unmaximize', e => {
		$win.webContents.send('isMaxWin', false)
	})
	// 窗口进入全屏状态时触发
	$win.on('enter-full-screen', e => {
		// if (process.platform === 'darwin') $win.setWindowButtonVisibility(true)
	})
	// 窗口离开全屏状态时触发
	$win.on('leave-full-screen', e => {
		// if (process.platform === 'darwin') $win.setWindowButtonVisibility(false)
	})
	$win.on('closed', e => {
		closeWinFun(e)
	})
	$win.on('focus', e => {
		if (App.willQuitApp) return
		App.$currentWin = $win
		if (process.platform === 'darwin') { // mac才需要注册一下快捷键
			const name = App.getWinName(App.$currentWin)
			if (name === 'main') { // 主窗口才响应多开快捷键
				globalShortcut.register('command+n', () => {
					const appPath = path.join(App.appPath, '..')
					// const appPath = '/Applications/App.app'
					const { exec } = require('child_process')
					const ls = exec(`open ${appPath} -n`)
					ls.stdout.on('data', (data) => {
						console.log(`stdout: ${data}`)
					})
					ls.stderr.on('data', (data) => {
						console.log(`stderr: ${data}`)
					})
					ls.on('close', (code) => {
						console.log('code:::', code)
					})
				})
			}
			globalShortcut.register('command+w', () => { // 修改mac系统里的默认操作
				switch (name) {
					case 'main':
						App.$currentWin.hide()
						break
					default:
						App.$currentWin.close()
				}
			})
		}
	})
	$win.on('blur', () => {
		if (process.platform === 'darwin') {
			// 注销快捷键
			globalShortcut.unregister('command+w')
			globalShortcut.unregister('command+n')
		}
	})
	/**
	 * 优雅的显示窗口
	 */
	$win.once('ready-to-show', () => {
		if ($win === null || !option.initShow) return
		$win.show()
		$win.focus()
	})

	/* $win.webContents.on('dom-ready', () => {
		// 页面初始化图标不跳动
		if (App.$tray) App.$tray.flicker(false)
		const filename = path.join(app.getAppPath(), './dist/preload/mainWin.js')
		// 读取js文件并执行
		fs.access(filename, fs.constants.R_OK, err => {
			if (err) return
			fs.readFile(filename, (error, data) => {
				if (error || $win.webContents.isDestroyed()) return
				$win.webContents.executeJavaScript(data.toString(), () => {
					if (!$win.webContents.isDestroyed()) $win.webContents.send('dom-ready')
				})
			})
		})
	})*/

	// 右键菜单
	$win.webContents.on('context-menu', (e, params) => {
		e.preventDefault()
		contextMenu($win, params)
	})

	// 禁用快捷键，ctrl+shift+enter会打开新窗口，原因未知
	$win.webContents.on('before-input-event', (event, input) => {
		if ((input.control || input.meta) && input.shift && input.key == 'Enter') {
		  event.preventDefault()
		}
	})

	// 浏览器中打开链接
	/* $win.webContents.on('new-window', (e, url) => {
		e.preventDefault()
		openExternal(url)
	})*/

	// 主窗口导航拦截
	/* $win.webContents.on('will-navigate', (e, url) => {
		e.preventDefault()
		openExternal(url)
	})*/
	if (typeof option.closeWindows === 'string' && option.closeWindows === 'all') {
		const windows = BrowserWindow.getAllWindows()
		windows.forEach(item => {
			if (App.getWinName(item) !== 'loadNetConfig') item.destroy()
		})
	} else {
		if (option.closeWindows.length) {
			for (var i = 0; i < option.closeWindows.length; i++) {
				if (App.windowArray[option.closeWindows[i]]) {
					App.windowArray[option.closeWindows[i]].destroy()
					delete App.windowArray[option.closeWindows[i]]
				}
			}
		}
	}
	App.windowArray[windowName] = $win
	return $win
}

export default App => (option) => {
	// 创建浏览器窗口
	return createWindow(App)(option)
}
