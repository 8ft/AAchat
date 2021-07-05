import utils from '../utils'
import fs from 'fs'
import path from 'path'
import http from 'http'
import https from 'https'
import { ipcMain } from 'electron'

const initFileName = (ext) => {
	return utils.md5(utils.randomId()) + '.' + ext
}

export default App => () => {
	ipcMain.on('saveImage', (event, arg) => {
		const fileName = initFileName('jpg')
		const fileNamePath = path.resolve(App.imagesPath, fileName)
		arg.buffer = arg.buffer.replace(/^data:image\/\w+;base64,/i, '')
		fs.writeFileSync(fileNamePath, Buffer.alloc(arg.buffer.length, arg.buffer, 'base64'))
		event.sender.send('saveImage-reply-' + arg.id, fileNamePath)
	})
	ipcMain.on('saveVoice', (event, arg) => {
		const fileName = initFileName('mp3')
		const fileNamePath = path.resolve(App.voicesPath, fileName)
		const writerStream = fs.createWriteStream(fileNamePath)
		writerStream.write(arg.buffer, 'base64')
		writerStream.end()
		writerStream.on('finish', function() {
			event.sender.send('saveVoice-reply-' + arg.id, fileNamePath)
		})
		writerStream.on('error', function(err) {
			console.log(err.stack)
		})
	})
	ipcMain.on('getLocalImage', (event, arg) => {
		let data = ''
		try {
			data = fs.readFileSync(arg.path)
			data = 'data:image/jpg;base64,' + data.toString('base64')
		} catch (e) {
			data = ''
		}
		event.sender.send('getLocalImage-reply-' + arg.id, data)
	})
	ipcMain.on('getLocalVoice', (event, arg) => {
		let data = fs.readFileSync(arg.path)
		data = 'data:audio/amr;base64,' + data.toString('base64')
		event.sender.send('getLocalVoice-reply-' + arg.id, data)
	})
	ipcMain.on('getRemoteImage', (event, arg) => {
		const port = arg.path.toLowerCase().indexOf('http://') > -1 ? http : https
		port.get(arg.path, function(req, res) {
			var imgData = ''
			req.setEncoding('base64')
			req.on('data', function(chunk) {
				imgData += chunk
			})
			req.on('end', function() {
				console.log('getRemoteImage:' + arg.path)
				event.sender.send('getRemoteImage-reply-' + arg.id, 'data:image/jpg;base64,' + imgData)
			})
			req.on('error', function(e) {
				event.sender.send('getRemoteImage-reply-' + arg.id, '')
			})
		})
	})
}
