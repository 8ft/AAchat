import Events from 'events'
import { Notification } from 'electron'
import logo from './logo'
import utils from '../utils/'

export default class Notify extends Events {
	$notify = null
	_App = null
	constructor({ App }) {
		super()
		this._App = App
	}
	show(data) {
		this.close()
		let body = data.text
		switch (data.cForm) {
			case 78: // 红包
				body = `[${this._App.i18n.__('point.pointsPackets')}]`
				break
			case process.env.webConfig.CHAT_MSG_TYPE.TYPE_LOCATION: // 地理位置
				body = `${this._App.i18n.__('location.name')}`
				break
			case process.env.webConfig.CHAT_MSG_TYPE.TYPE_TEXT: // 文字
				body = data.mType === 'card' ? `[${this._App.i18n.__('common.contactCard')}]` : data.text
				break
			case process.env.webConfig.CHAT_MSG_TYPE.TYPE_FILE: // 文件
				body = `[${this._App.i18n.__('common.file')}] ` + (data.newFileName || data.fileName)
				break
		}
		if (data.threadType === 1) body = data.name + '：' + body
		body = body.length > 40 ? (body.substr(0, 34) + '...') : body
		const option = {
			title: data.threadType === 1 ? data.groupName : data.name,
			silent: true,
			body
		}
		if (utils.os.isWindows) option.icon = logo
		this.$notify = new Notification(option)
		this.$notify.on('click', () => {
			this.close()
			this.emit('click', data)
		})
		this.$notify.show()
	}

	/**
	 * 关闭提示
	 */
	close() {
		if (this.$notify) {
			this.$notify.close()
			this.$notify = null
		}
	}
}
