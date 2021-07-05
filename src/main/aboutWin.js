import path from 'path'
import logo from './logo'
import contextMenu from './contextMenu'
import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow, ipcMain } from 'electron'

export default App => () => {
	if (App.$aboutWin) {
		App.$aboutWin.show()
		App.$aboutWin.focus()
		return App.$aboutWin
	}
	const $win = new BrowserWindow({
		title: '关于',
		width: 320,
		height: 400,
		useContentSize: true,
		resizable: false,
		menu: false,
		parent: App.$mainWin,
		modal: process.platform !== 'darwin',
		show: false,
		icon: logo,
		webPreferences: {
			nodeIntegration: true
		}
	})

	$win.on('ready-to-show', () => {
		$win.show()
		$win.focus()
	})

	// 窗口关闭后手动让$window为null
	$win.on('closed', () => {
		App.$aboutWin = null
	})

	$win.webContents.on('dom-ready', () => {
		if (!$win.webContents.isDestroyed()) $win.webContents.send('dom-ready')
	})

	// 右键上下文菜单
	$win.webContents.on('context-menu', (e, params) => {
		e.preventDefault()
		contextMenu($win, params)
	})

	ipcMain.on('ABOUTWIN:checkForUpdates', () => {
		autoUpdater.checkForUpdates()
	})

	// 加载URL地址
	const URL = process.env.NODE_ENV === 'development'
		? 'http://localhost:8080/aboutWin.html'
		: `file://${path.join(app.getAppPath(), './dist/renderer/aboutWin.html')}`

	$win.loadURL(URL)
	return $win
}
