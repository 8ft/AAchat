import fs from 'fs'
import request from 'request'
import { dialog } from 'electron'

function StreamDownload() {
	this.totalBytes = 0
	this.receivedBytes = 0
	this.downloadCallback = null
	this.req = null
	this.saveFilePath = null
	this.state = ''
	this.timestamp = 0
}

// 下载进度
StreamDownload.prototype.showProgress = function(received, total) {
	this.downloadCallback('progress', { totalBytes: this.totalBytes, receivedBytes: this.receivedBytes })
}
// 终止下载
StreamDownload.prototype.abort = function() {
	this.req.abort()
	this.state = 'abort'
	if (this.saveFilePath) {
		fs.unlink(this.saveFilePath, err => {
			if (err) console.error('abortDownloadDeleteFile@', err)
		})
	}
}
// 下载过程
StreamDownload.prototype.downloadFile = function(downloadURL, saveFilePath, callback) {
	const fileData = []
	this.downloadCallback = callback // 注册回调函数
	this.req = request({
		method: 'GET',
		uri: downloadURL,
		rejectUnauthorized: false,
		timeout: 20000
	})
	this.saveFilePath = saveFilePath
	this.req.on('response', (data) => {
		if (data.statusCode !== 200) {
			this.abort()
		} else {
			this.totalBytes = parseInt(data.headers['content-length'], 10)
		}
	})
	this.req.on('data', (chunk) => {
		fileData.push(chunk)
		this.receivedBytes += chunk.length
		const tempTime = new Date().getTime()
		if (Math.abs(tempTime - this.timestamp) > 90) { // 回调的时间间隔
			this.timestamp = tempTime
			this.downloadCallback('progress', { totalBytes: this.totalBytes, receivedBytes: this.receivedBytes })
		}
	})
	this.req.on('error', () => {
		this.abort()
		dialog.showErrorBox('error', '下载失败，请稍后重试！')
	})
	this.req.on('end', () => {
		if (this.state === 'abort') {
			this.downloadCallback('abort', { totalBytes: this.totalBytes, receivedBytes: this.receivedBytes })
		} else {
			fs.writeFile(saveFilePath, Buffer.concat(fileData, this.receivedBytes), (err) => {
				if (err) {
					this.downloadCallback('save-error', { totalBytes: this.totalBytes, receivedBytes: this.receivedBytes })
				} else {
					this.downloadCallback('finished', { totalBytes: this.totalBytes, receivedBytes: this.receivedBytes })
				}
			})
		}
	})
}
export default StreamDownload
