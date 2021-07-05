import { Tray, Menu, systemPreferences } from 'electron'
import {
	getMessageTrayIcon,
	getNoMessageTrayIcon,
	mouseOverTrayIcon,
	emptyTrayIcon,
	getMessageIcon,
	getNewFriendIcon
} from './logo'
import utils from '~/utils/'

export default class Trays {
	_App = null
	// 图标闪烁定时
	_flickerTimer = null

	isDarkMode = systemPreferences.isDarkMode()
	// 托盘对象
	$tray = null
	// 图标文件
	messageTrayIcon = getMessageTrayIcon(this.isDarkMode)
	noMessageTrayIcon = getNoMessageTrayIcon(this.isDarkMode)
	mouseOverTrayIcon = mouseOverTrayIcon()
	emptyTrayIcon = emptyTrayIcon
	newFriendNum = 0
	isOpenMenu = false
	tempLeftMenuData = []
	oldLeftMenuData = ''
	oldNewFriendNum = 0
	leftMenuData = []
	rightMenuData = []
	leftMenu = []
	rightMenu = []

	constructor({ App }) {
		try {
			this._App = App
			this.buildRightMenu()
			// 生成托盘图标及其菜单项实例
			this.$tray = new Tray(this.noMessageTrayIcon)
			// 设置鼠标悬浮时的标题
			this.setToolTip()
			this.initEvent()
			if (utils.os.isMac) {
				systemPreferences.subscribeNotification(
					'AppleInterfaceThemeChangedNotification',
					() => {
						this.isDarkMode = systemPreferences.isDarkMode()
						this.noMessageTrayIcon = getNoMessageTrayIcon(this.isDarkMode)
						this.$tray.setImage(this.noMessageTrayIcon)
						this.buildLeftMenu()
					}
				)
			}
		} catch (e) {
			console.error('Tray, constructor')
			console.error(e)
		}
	}
	// setToolTip
	setToolTip(txt) {
		txt = txt ? (process.env.PROJECT_NAME + ':' + txt) : process.env.PROJECT_NAME
		if (this.$tray) this.$tray.setToolTip(txt)
	}
	/**
	 * 初始化事件
	 */
	initEvent() {
		this.$tray.on('click', () => {
			this.mouseOver(1)
			/* if (this.tempLeftMenuData.length) {
				this.$tray.popUpContextMenu(this.leftMenu)
			} else {
				this._App.showMainWin()
			}*/
			this._App.showMainWin()
		})
		this.$tray.on('double-click', () => {
			// this._App.showMainWin()
		})
		this.$tray.on('right-click', () => {
			if (this.tempLeftMenuData.length) {
				this.$tray.popUpContextMenu(this.leftMenu)
			} else {
				this.$tray.popUpContextMenu(this.rightMenu)
			}
			this.mouseOver()
		})
		this.$tray.on('mouse-leave', () => {
			this.mouseOut()
		})
	}

	mouseOver(type) {
		try {
			this.isOpenMenu = true
			if (utils.os.isMac && type) {
				this.$tray.setPressedImage(this.mouseOverTrayIcon)
			} else {
				this.$tray.setImage(this.mouseOverTrayIcon)
			}
		} catch (e) {
			console.error('Tray, mouseOver')
			console.error(e)
		}
	}
	buildRightMenu() {
		this.rightMenuData = [
			/* {
        label: 'process.crash()',
        click: () => {
          process.crash()
        }
      },*/
			{
				label: this._App.i18n.__mf('common.showIM', { projectName: process.env.PROJECT_NAME }),
				click: () => this._App.showMainWin()
			},
			{
				label: this._App.i18n.__('common.aboutIM'),
				click: () => this._App.openAboutWin()
			},
			{
				type: 'separator'
			},
			{
				label: this._App.i18n.__('common.exitIM'),
				click: () => this._App.quit()
			}
		]
		this.rightMenu = Menu.buildFromTemplate(this.rightMenuData)
	}
	mouseOut() {
		try {
			this.isOpenMenu = false
			this.$tray.setImage(this.noMessageTrayIcon)
		} catch (e) {
			console.error('Tray, mouseOut')
			console.error(e)
		}
	}

	// 设置左键，划过菜单
	buildLeftMenu() {
		try {
			this.tempLeftMenuData = []
			for (let i = 0; i < this.leftMenuData.length && i < 4; i++) {
				this.tempLeftMenuData.push({
					label: (this.leftMenuData[i].unreadCount > 99 ? '99+' : this.leftMenuData[i].unreadCount) + '   ' + (this.leftMenuData[i].name || '未命名'),
					icon: getMessageIcon(this.isDarkMode, this.leftMenuData[i].id),
					click: () => {
						if (this._App.isLogout) {
							this._App.showMainWin()
							return
						}
						if (process.platform === 'win32') this._App.$mainWin.setSkipTaskbar(false)
						this._App.$mainWin.webContents.send('open-chat-window', {
							threadID: this.leftMenuData[i].id,
							threadType: this.leftMenuData[i].type
						})
					}
				})
			}
			if (this.newFriendNum) {
				this.tempLeftMenuData.push({
					label: (this.newFriendNum > 99 ? '99+' : this.newFriendNum) + '      ' + this._App.i18n.__('common.addFriendRequest'),
					icon: getNewFriendIcon(this.isDarkMode),
					click: () => {
						this._App.showMainWin()
						if (this._App.isLogout) return
						this._App.$mainWin.webContents.send('open-contact-window')
					}
				})
			}
			if (this.tempLeftMenuData.length) {
				this.tempLeftMenuData.push(
					{
						type: 'separator'
					}
				)
				this.tempLeftMenuData = this.tempLeftMenuData.concat(this.rightMenuData)
				if (this.isOpenMenu) {
					// this.$tray.popUpContextMenu(this.leftMenu)
				}
			}
			this.leftMenu = Menu.buildFromTemplate(this.tempLeftMenuData)
		} catch (e) {
			console.error('Tray, buildLeftMenu')
			console.error(e)
		}
	}

	setLeftMenu(data, newFriendNum) {
		if (this.oldLeftMenuData !== JSON.stringify(data) || this.oldNewFriendNum !== newFriendNum) {
			this.oldLeftMenuData = JSON.stringify(data)
			this.oldNewFriendNum = newFriendNum
			this.leftMenuData = data
			this.newFriendNum = newFriendNum
			this.buildLeftMenu()
		}
	}

	/**
	 * 控制图标是否闪烁
	 * @param {Boolean} is
	 */
	flicker(count) {
		try {
			const hasNewMsg = count !== 0 && count !== undefined
			if (hasNewMsg) {
				let icon = this.messageTrayIcon
				if (utils.os.isWindows) {
					// 防止连续调用多次，导致图标切换时间间隔不是1000ms
					if (this._flickerTimer !== null) return
					this._flickerTimer = setInterval(() => {
						this.$tray.setImage(icon)
						icon = icon === this.messageTrayIcon ? this.emptyTrayIcon : this.messageTrayIcon
					}, 500)
				} else {
					this.$tray.setTitle(count > 99 ? '99+' : count.toString())
				}
			} else {
				clearInterval(this._flickerTimer)
				this.$tray.setTitle('')
				this._flickerTimer = null
				this.$tray.setImage(this.noMessageTrayIcon)
			}
		} catch (e) {
			console.error('Tray, flicker')
			console.error(e)
		}
	}

	/**
	 * 判断托盘是否销毁
	 */
	isDestroyed() {
		return this.$tray.isDestroyed()
	}

	/**
	 * 销毁托盘图标
	 */
	destroy() {
		return this.$tray.destroy()
	}
}
