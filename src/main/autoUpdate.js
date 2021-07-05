// 自动更新 wuxl
import { ipcMain, dialog, app } from 'electron'
import path from 'path'
import utils from '../utils/'
import { default as logo, darkIcon } from './logo'
import createWin from './createWin'
import $moment from 'moment-timezone'

const { exec, spawn } = require('child_process')

export default class AutoUpdate {
	_App = null
	$updateWin = null
	updateData = null
	downloadItem = null
	downloadState = null
	downloadPath = null
	urlParams = null
	constructor({ App }) {
		this._App = App
		ipcMain.on('openUpdateWin', (event, data) => {
			this.openUpdateWin(data)
		})
	}
	async initUpdateWin(data) {
		this.updateData = data
		if (this.$updateWin) {
			if (this.urlParams !== encodeURIComponent(JSON.stringify(data))) {
				// this.$updateWin.loadURL(this._App.winURL + '#/update?params=' + encodeURIComponent(JSON.stringify(data)))
				this.$updateWin.webContents.send('params', data)
				this.urlParams = encodeURIComponent(JSON.stringify(data))
			}
			// 如果是强制更新，向主界面发送显示遮罩
			if (this.updateData.upgrade === '2') this._App.$mainWin.webContents.send('update-mask', true)
			this.$updateWin.show()
			this.$updateWin.focus()
			return
		}
		this.urlParams = encodeURIComponent(JSON.stringify(data))
		this.$updateWin = await createWin(this._App)({
			name: 'update',
			title: this._App.i18n.__('common.update'),
			height: 423,
			width: 505,
			winURL: '/update?params=' + encodeURIComponent(JSON.stringify(data)),
			resizable: false,
			frame: false,
			hasShadow: false,
			transparent: true,
			titleBarStyle: 'customButtonsOnHover',
			menu: false,
			parent: this._App.$mainWin,
			modal: process.platform !== 'darwin',
			closeCurrentType: 'warning',
			warningCallBack: () => {
				if (this.downloadState === null) {
					this.exitAutoUpdate()
					if (this.updateData && this.updateData.upgrade === '2') this._App.quit()
					return
				}
				dialog.showMessageBox({
					type: 'info',
					icon: logo,
					buttons: [this._App.i18n.__('common.okBtn'), this._App.i18n.__('common.exitBtn')],
					defaultId: 0,
					cancelId: 1,
					message: this._App.i18n.__('about.updateClose')
				}).then(({ response: index }) => {
					if (index === 0) {
						if (this.updateData) {
							if (this.updateData.upgrade === '1') { // 建议更新
								this.exitAutoUpdate()
							} else if (this.updateData.upgrade === '2') { // 强制更新
								this.exitAutoUpdate()
								this._App.quit()
							}
						}
					}
				})
			}
		})
		this.addDownloadListener()
		if (this.updateData.upgrade === '2') this._App.$mainWin.webContents.send('update-mask', true)
		ipcMain.on('autoUpdate-download', () => {
			this.setIcon(darkIcon)
			this.$updateWin.webContents.downloadURL(data.url)
		})
	}
	async openUpdateWin(res, from) {
		if (res.code === 0 && res.data.upgrade !== '0') {
			let { lastGetVersionTime, lastGetVersionNo } = this._App.sysConfig
			if (!lastGetVersionTime) {
				lastGetVersionTime = this._App.serverTime
				lastGetVersionNo = res.data.version
				await this._App.setSysConfig({ lastGetVersionTime: lastGetVersionTime, lastGetVersionNo })
			} else {
				const newTime = this._App.serverTime
				const diffTime = $moment(newTime).diff($moment(parseInt(lastGetVersionTime)), 'days')
				if (diffTime <= 7 && from === 'main' && lastGetVersionNo === res.data.version) { // 7天内检测到版本且与上一次检测版本一致则不再提示.
					return
				} else {
					await this._App.setSysConfig({ lastGetVersionTime: newTime, lastGetVersionNo: res.data.version })
				}
			}
			await this.initUpdateWin(res.data)
		} else if (res.code === 604) {
			await this.initUpdateWin(res.data)
		}
	}

	setIcon(path) {
		if (utils.os.isMac) {
			app.dock.setIcon(path)
		}
	}

	autoInstallation() {
		return new Promise((resolve, reject) => {
			if (this.downloadPath) {
				if (this.$updateWin) {
					this.$updateWin.webContents.send('downstate', {
						percent: 1,
						text: this._App.i18n.__('common.updateInstall'),
						updateState: 'install'
					})
				}
				if (this.updateData.updateType === '0') { // 软件签名后热更新不可用
					/* const AdmZip = require('adm-zip')
					console.log('this.downloadPath:::', this.downloadPath)
					console.log('this._App.appPath:::', this._App.appPath)
					const zip = new AdmZip(this.downloadPath)
					zip.extractAllTo(this._App.appPath, /!* overwrite*!/true)
					fs.unlinkSync(this.downloadPath)
					const appVersion = fs.readFileSync(path.resolve(this._App.appPath, utils.os.isMac ? 'Resources' : 'resources', 'version'), 'utf-8')
					this._App.sqliteDb.setConfig({ appVersion })
					resolve('0')*/
				} else { // 重新安装
					let ls
					if (utils.os.isMac) {
						ls = exec(`hdiutil attach ${this.downloadPath.replace(/ /g, '\\ ')} -autoopen`)
					} else {
						ls = spawn('explorer.exe', [this.downloadPath])
					}
					ls.stdout.on('data', (data) => {
						console.log(`stdout: ${data}`)
					})
					ls.stderr.on('data', (data) => {
						reject(`stderr: ${data}`)
					})
					ls.on('close', (code) => {
						console.log('code:::', code)
						if (code === 0 || code === 1) { // 运行成功
							resolve('1')
						}
					})
				}
			}
		})
	}

	addDownloadListener() {
		return new Promise((resolve, reject) => {
			this.$updateWin.webContents.session.on('will-download', (event, item, webContents) => {
				if (webContents.browserWindowOptions.name !== 'update') return
				this.downloadItem = item
				this.downloadPath = path.resolve(this._App.updatePath, utils.formatDate(new Date(), 'yyyy.MM.dd.hh.mm.ss') + '_' + encodeURIComponent(item.getFilename().replace(/\(/g, '').replace(/\)/g, '')))
				item.setSavePath(this.downloadPath)
				const total = item.getTotalBytes()
				item.on('updated', (event, state) => {
					this.downloadState = state
					if (state === 'interrupted') {
						console.log('Download is interrupted but can be resumed')
						const tip1 = this._App.i18n.__('about.updateFailed')
						dialog.showErrorBox(tip1[0], tip1[1])
						this.exitAutoUpdate()
					} else if (state === 'progressing') {
						if (item.isPaused()) {
							console.log('Download is paused')
						} else {
							const percent = item.getReceivedBytes() / total
							// console.log('percent:', percent)
							if (this.$updateWin) {
								this.$updateWin.setProgressBar(percent)
								this.$updateWin.webContents.send('downstate', {
									percent,
									text: this._App.i18n.__('common.updatePackageDownloading'),
									updateState: 'downloading'
								})
							}
						}
					}
				})
				item.once('done', (event, state) => {
					this.downloadState = state
					if (state === 'completed') {
						console.log('Download successfully')
						if (this.$updateWin) {
							this.$updateWin.webContents.send('downstate', {
								percent: 1,
								text: this._App.i18n.__('common.downloadCompleted'),
								updateState: 'downloading'
							})
						}
						// 下载完成，开始安装
						this.autoInstallation().then(updateType => {
							if (updateType === '0') {
							} else if (updateType === '1') {
								// 成功启动安装，安装前要关闭应用
								this.exitAutoUpdate()
								this._App.quit()
							}
						}).catch(e => {
							console.error('update@', e)
							const tip1 = this._App.i18n.__('about.updateFailed')
							dialog.showErrorBox(tip1[0], this._App.i18n.__('common.updateError'))
							this.exitAutoUpdate()
							this._App.quit()
						})
					} else {
						console.log(`Download failed: ${state}`)
						if (this.$updateWin) this.$updateWin.webContents.send('downstate', state)
					}
				})
			})
		})
	}

	exitAutoUpdate() {
		this.setIcon(logo)
		if (this.downloadState !== 'completed' && this.downloadState !== null) this.downloadItem.cancel()
		if (this.$updateWin) {
			this.$updateWin.webContents.send('downstate', { percent: 0, text: 0, updateState: '' })
			this.downloadState = null
			this.$updateWin.setProgressBar(-1)
			this.$updateWin.hide()
		}
	}
}
