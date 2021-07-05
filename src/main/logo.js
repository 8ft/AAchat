import { screen, app } from 'electron'
import path from 'path'
const appPath = process.env.NODE_ENV === 'development' ? app.getAppPath() : path.join(app.getAppPath(), 'dist', 'desktop')
const logoPng = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/logo.png'))
const logoIco = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/logo.ico'))
const logoDark = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/logo-dark.png'))
const empty = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/empty.png'))
const messageWhite = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/message-white@2x.png'))
const messageBlack = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/message-black@2x.png'))
const sysWhite = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/sys-white@2x.png'))
const sysBlack = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/sys-black@2x.png'))
const pointBlack = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/point-black@2x.png'))
const pointWhite = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/point-white@2x.png'))
const friendWhite = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/friend-white@2x.png'))
const friendBlack = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/friend-black@2x.png'))
const x32 = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/32x32@2x.png'))
const x322 = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/32x32-2@2x.png'))
const x64 = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/64x64.png'))
const x20 = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/20x20.png'))
const nx32 = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/news-32x32@2x.png'))
const nx64 = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/news-64x64.png'))
const nx20 = path.join(appPath, require('~/resources/' + process.env.PROJECT_NAME + '/tray/news-20x20.png'))

export default process.platform === 'darwin' ? logoPng : logoIco
export const darkIcon = logoDark

export const emptyTrayIcon = empty

export function getMessageIcon(isDarkMode, id) {
	let white = messageWhite
	let black = messageBlack
	switch (id) {
		case 'notify':
			white = sysWhite
			black = sysBlack
			break
		case 'point':
			white = pointWhite
			black = pointBlack
			break
	}
	if (process.platform === 'darwin') {
		return isDarkMode ? white : black
	} else {
		return black
	}
}

export function getNewFriendIcon(isDarkMode) {
	if (process.platform === 'darwin') {
		return isDarkMode ? friendWhite : friendBlack
	} else {
		return friendBlack
	}
}

/**
 * 没有消息时的托盘图标
 */
export function getNoMessageTrayIcon(isDarkMode) {
	if (process.platform === 'darwin') {
		return isDarkMode ? x32 : x322
	} else if (process.platform === 'win32') {
		return x64
	} else if (screen.getPrimaryDisplay().scaleFactor > 1) {
		return x64
	} else {
		return x20
	}
}

// mac浅色模式鼠标切换
export function mouseOverTrayIcon(isDarkMode) {
	if (process.platform === 'darwin') {
		return x32
	} else if (process.platform === 'win32') {
		return x64
	} else if (screen.getPrimaryDisplay().scaleFactor > 1) {
		return x64
	} else {
		return x20
	}
}

/**
 * 有消息时的托盘图标
 */
export function getMessageTrayIcon(isDarkMode) {
	if (process.platform === 'darwin') {
		return nx32
	} else if (process.platform === 'win32') {
		return nx64
	} else if (screen.getPrimaryDisplay().scaleFactor > 1) {
		return nx64
	} else {
		return nx20
	}
}
