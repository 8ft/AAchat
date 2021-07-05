const { remote, ipcRenderer } = require('electron')

module.exports = {
	getVideo: () => {
		return remote.getGlobal('RTC').video
	},
	sendVideoStream: (stream) => {
		const id = new Date().getTime()
		return new Promise((resolve, reject) => {
			ipcRenderer.send('getVideoStream', { id, stream })
			ipcRenderer.once('getVideoStream-reply-' + id, event => {
				resolve()
			})
		})
	}
}
