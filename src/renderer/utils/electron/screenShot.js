const { remote, ipcRenderer } = require('electron')
const utils = require('~/utils/').default
const path = require('path')
const os = require('@/utils/common/os')
const { spawn } = require('child_process')
const appPath = remote.getGlobal('appPath')
const exePath = process.env.NODE_ENV === 'production' ? path.join(appPath, 'Resources', 'capture') : path.join(__dirname, '..', '..', 'components', 'capture')

function openScreenShot(type) { // type截图方式 1普通截图，2隐藏主窗口截图
	let key = 'niuniu_app_aachat_' + utils.formatDate(new Date(), 'yyyyMd')
	key = utils.md5(key)
	let screenShotExePath = ''
	let screenShotPatharam = []
	if (os.isWindows) {
		screenShotExePath = path.join(exePath, 'win', 'NiuniuCapture.exe')
		screenShotPatharam = [`${key},,null,0,0,0,0,0`]
	} else { // MacOS
		screenShotExePath = path.join(exePath, 'mac', 'AAChatCapture.app', 'Contents', 'MacOS', 'AAChatCapture')
		screenShotPatharam = [`startfromlocal,${path.join(exePath, 'mac', 'set.info')},${path.join(exePath, 'mac', 'response.info')},${key},0,0,0,0,0,0`]
	}
	if (type === 2) remote.getCurrentWindow().hide()
	const ls = spawn(screenShotExePath, screenShotPatharam)
	ls.stdout.on('data', (data) => {
		// console.log(`stdout: ${data}`);
	})
	ls.stderr.on('data', (data) => {
		// console.log(`stderr: ${data}`);
	})
	ls.on('close', (code) => {
		if (code === 1) { // 完成截图
			if (type === 2) remote.getCurrentWindow().show()
			ipcRenderer.send('complateScreenshot')
		} else if (code === 2) { // 退出截图
			if (type === 2) remote.getCurrentWindow().show()
		} else if (code === 3) { // 保存截图

		}
	})
}

module.exports = openScreenShot
