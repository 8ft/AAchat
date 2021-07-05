import { ipcMain } from 'electron'

export default class TimeClock {
	_App = null
	baseTime
	newTime
	interval = null
	constructor({ App }) {
		this._App = App
		// this.setTime()
		// this.timer()
		ipcMain.on('getServerTime', (event, args) => {
			// const id = args.id
			// event.sender.send('getServerTime-reply-' + id, this.newTime)
			const time = this._App.chatSdk.cTime()
			const returnValue = parseInt(time / 1000000)
			console.log('chatSdk:cTime', args || '', returnValue)
			event.returnValue = returnValue
		})
	}
	setTime() {
		this.baseTime = this.getBaseTime()
		this.newTime = this.baseTime
	}
	getBaseTime() {
		let time
		try {
			time = parseInt(this._App.chatSdk.cTime() / 1000000)
			console.log('getServerTime:::', time)
		} catch (e) {
			time = new Date().getTime()
		}
		return time
	}
	timer() {
		this.interval = setInterval(() => {
			this.newTime += 1000
			this._App.serverTime = this.newTime
			if (this.newTime - this.baseTime > 60000) {
				if (this.interval) clearInterval(this.interval)
				this.resetTime()
			}
		}, 1000)
	}
	resetTime() {
		this.setTime()
		this.timer()
	}
	stopTimer() {
		// if (this.interval) clearInterval(this.interval)
	}
}
