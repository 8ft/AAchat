import http from 'http'
import express from 'express'
import request from 'request'
import bodyParser from 'body-parser'
import fs from 'fs'
import { getVideoMetaData } from '../ffmpeg-helper'
import utils from '~/utils'
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe').path
ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

export default class WebServer {
	_App = null
	_ffmpegCommand = null
	chatSdk = null
	sqliteDb = null
	webServer = null
	api_version = process.env.webConfig.api_version
	app_var = process.env.webConfig.VERSION
	client_type = process.env.webConfig.client_type
	device_id = global.deviceId
	device_system = global.deviceSystem
	device_type = global.deviceType
	constructor({ App }) {
		this._App = App
		this.createStreamServer()
	}
	killFfmpegCommand() {
		try {
			if (this._ffmpegCommand && typeof this._ffmpegCommand.kill === 'function') {
				this._ffmpegCommand.kill()
			}
		} catch (e) {
			console.error('video-web@', e)
		}
	}
	closeServer() {
		if (this.webServer) this.webServer.close()
	}
	async getDataState(key, type, params, time) {
		return new Promise((resolve, reject) => {
			if (this._App.isLogout) return resolve({ code: 800506, data: {}})
			const d = this.chatSdk.cAsync(key)
			if (d) {
				return resolve({ code: 0, data: d, key })
			} else {
				if ((new Date().getTime() - time) / 60000 > 2) { // 超时
					return resolve({ code: 800500 })
				} else {
					if (!this._App.isLogout) {
						return resolve({ code: 1 })
					} else {
						return resolve({ code: 800506, data: {}})
					}
				}
			}
		}).then(async res => {
			if (res.code === 1) {
				await this.waiting(0)
				return this.getDataState(key, type, params, time)
			} else if (res.code === 0) {
				if (typeof res.data === 'object') res.data.key = key
				return Promise.resolve(res.data)
			} else if (res.code === 800506) {
				return Promise.reject(800506)
			} else {
				return Promise.reject(500)
			}
		})
	}
	waiting(time) {
		return new Promise(resolve => {
			setTimeout(() => resolve(), time)
		})
	}
	createStreamServer() {
		const app = express()
		/**
		 * 定义数据解析器
		 */
		app.use(bodyParser.json({ limit: '50mb' }))
		app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))
		app.use((req, res, next) => {
			const { api_version, app_var, client_type, device_id, device_system, device_type, token } = req.headers
			if (api_version === this.api_version &&
				app_var === this.app_var &&
				client_type === this.client_type &&
				device_id === this.device_id &&
				device_system === this.device_system &&
				device_type === this.device_type &&
				token === (!this._App.accountInfo ? '' : this._App.accountInfo.token)) {
				next()
			} else {
				res.send('呵呵')
			}
		})
		app.use('/api/*', async(req, res, next) => {
			const url = '/' + req.params[0].toLowerCase()
			console.log('api:::::', url)
			let token = ''
			const params = Object.assign({}, req.body.params || {})
			params.appKey = process.env.webConfig.proxy_app_key
			if ((url === '/user/userauth/login' && params.password) || (url === '/user/userauth/register' && params.password) || (url === '/user/userauth/forgetpwd' && params.newPassword) || (url === '/user/userauth/changepwd')) {
				params.password = utils.md5(params.password + process.env.webConfig.pstring)
				params.confirmPassword = utils.md5(params.confirmPassword + process.env.webConfig.pstring)
				params.newPassword = utils.md5(params.newPassword + process.env.webConfig.pstring)
				params.oldPassword = utils.md5(params.oldPassword + process.env.webConfig.pstring)
				params.newPasswordConfirm = utils.md5(params.newPasswordConfirm + process.env.webConfig.pstring)
			}
			let data
			let organId = ''
			try {
				if (this._App.sqliteDb && this._App.sqliteDb.userDb) {
					if (!this._App.accountInfo) {
						await this._App.getAccountInfo()
					}
					if (this._App.accountInfo.token) token = this._App.accountInfo.token
					if (this._App.accountInfo.organId) organId = this._App.accountInfo.organId
				}
				params.sign = utils.apiSign(params)
				data = await this._App.axios.post('/' + req.params[0], {
					params,
					token,
					lang: this._App.sysConfig.lang || '',
					organId
				})
			} catch (e) {
				data = {
					code: 899999,
					message: this._App.i18n.__('common.netErrorTip')[0]
				}
				console.error(`MainError---API@${url}#response:`, e)
			}
			res.send(data)
		})
		app.use('/video/:messageId/:videoPath', async(req, res, next) => {
			if (req.params.videoPath) {
				this.killFfmpegCommand()
				const videoPath = decodeURIComponent(req.params.videoPath)
				const resourceOnLine = videoPath.startsWith('http') || videoPath.startsWith('https')
				const { videoCodecSupport, audioCodecSupport, size } = (await getVideoMetaData(this._App)(videoPath)).data
				if (videoCodecSupport && audioCodecSupport && !resourceOnLine) {
					const fileSize = size
					const range = req.headers.range
					if (range) {
						// 有range头才使用206状态码
						const parts = range.replace(/bytes=/, '').split('-')
						const start = parseInt(parts[0], 10)
						let end = parts[1] ? parseInt(parts[1], 10) : start + 999999

						// end 在最后取值为 fileSize - 1
						end = end > fileSize - 1 ? fileSize - 1 : end

						const chunksize = (end - start) + 1
						const head = {
							'Content-Range': `bytes ${start}-${end}/${fileSize}`,
							'Accept-Ranges': 'bytes',
							'Content-Length': chunksize,
							'Content-Type': 'video/mp4'
						}
						res.writeHead(206, head)
						resourceOnLine ? request(videoPath).pipe(res) : fs.createReadStream(videoPath, {
							start,
							end
						}).pipe(res)
					} else {
						const head = {
							'Content-Length': fileSize,
							'Content-Type': 'video/mp4'
						}
						res.writeHead(200, head)
						resourceOnLine ? request(videoPath).pipe(res) : fs.createReadStream(videoPath).pipe(res)
					}
				} else {
					this._ffmpegCommand = ffmpeg()
					.input(videoPath)
					// read input at native framerate
					.nativeFramerate()
					.videoCodec(videoCodecSupport ? 'copy' : 'libx264')
					.audioCodec(audioCodecSupport ? 'copy' : 'aac')
					.format('mp4')
					.seekInput(0)
					// fragmeted mp4
					.outputOptions('-movflags', 'frag_keyframe+empty_moov')
					.pipe(res)
				}
			}
		})
		app.use('/sqlite/:type', async(req, res, next) => {
			const type = req.params.type
			let data = { code: 999999, type, message: this._App.i18n.__('common.error') }
			if (type && this._App.sqliteDb) {
				try {
					if (req.body.param && req.body.param.length) {
						data = await this._App.sqliteDb[type](...req.body.param)
					} else {
						data = await this._App.sqliteDb[type]()
					}
					console.log('sqlite@webserver:', type, 'success')
				} catch (e) {
					data = { code: 999999, type, message: e }
					console.log('sqlite@webserver:', type, 'fail')
				}
				res.send(data)
			} else {
				res.send(data)
			}
		})
		app.use('/chatSdk/:type', async(req, res, next) => {
			const type = req.params.type
			let data = { code: 5000, message: 'sdk连接错误' }
			if (type && this._App.chatSdk) {
				this.chatSdk = this._App.chatSdk
				const param = req.body.param || []
				if (type !== 'cGetAsync' && type !== 'cGetDoneAsync') console.log('chatSdk@webserver:', type)
				try {
					switch (type) {
						case 'initChat':
							data = this.chatSdk.cHostsAsync(this._App.api_url_config.im_socket_url)
							data = await this.getDataState(data, type, param, new Date().getTime())
							this.chatSdk.cToken(this._App.accountInfo.userId, global.deviceId, this._App.accountInfo.token, '')
							this._App.isLogout = false
							data = {
								code: 0
							}
							break
						default:
							if (this._App.isLogout) {
								data = { code: 800506, message: '登录失败，请重新登录' }
								break
							}
							if (type.indexOf('Async') > -1) {
								const key = this.chatSdk[type](...param)
								data = await this.getDataState(key, type, param, new Date().getTime())
							} else {
								if (param.length) {
									data = this.chatSdk[type](...param)
								} else {
									data = this.chatSdk[type]()
								}
							}
					}
					res.send(data)
				} catch (e) {
					const error = { code: 899999 }
					if (e === 800506) error.code = 800506
					res.send(error)
					console.error('chatSdk@' + type + ':', e ? e.toString() : e)
				}
			} else {
				res.end(data)
			}
		})
		/* app.use('/voice', (req, res, next) => {
			const pathSrc = (path.resolve(voicesPath, req.query.fileName))
			const stat = fs.statSync(pathSrc)
			const fileSize = stat.size
			const range = req.headers.range
			if (range) {
				// 有range头才使用206状态码
				const parts = range.replace(/bytes=/, '').split('-')
				const start = parseInt(parts[0], 10)
				let end = parts[1] ? parseInt(parts[1], 10) : start + 999999
				// end 在最后取值为 fileSize - 1
				end = end > fileSize - 1 ? fileSize - 1 : end

				const chunksize = (end - start) + 1
				const file = fs.createReadStream(pathSrc, {
					start,
					end
				})
				const head = {
					'Content-Range': `bytes ${start}-${end}/${fileSize}`,
					'Accept-Ranges': 'bytes',
					'Content-Length': chunksize,
					'Content-Type': 'audio/x-mei-aac'
				}
				res.writeHead(206, head)
				file.pipe(res)
			} else {
				const head = {
					'Content-Length': fileSize,
					'Content-Type': 'audio/x-mei-aac'
				}
				res.writeHead(200, head)
				fs.createReadStream(pathSrc).pipe(res)
			}
		})*/
		const server = http.createServer(app)
		server.listen(0)
		server.on('listening', function() {
			const port = server.address().port
			global.serverPort = port
			console.log('server listening', port)
		})
		server.on('close', function() {
			console.log('server close')
		})
		this.webServer = server
	}
}

/*
export const startStreamServer = App => () => {
	const _App = App
	const app = express()
	const voicesPath = _App.voicesPath
	app.use((req, res, next) => {
		if (req.headers.token === App.accountInfo.token) next()
	})
	app.use('/video/:messageId', async(req, res, next) => {
		if (_App.videoStream) {
			const videoPath = _App.videoStream
			const { videoCodecSupport, audioCodecSupport } = (await getVideoMetaData(videoPath)).data
			if (videoCodecSupport && audioCodecSupport) {
				const stat = fs.statSync(videoPath)
				const fileSize = stat.size
				const range = req.headers.range
				if (range) {
					// 有range头才使用206状态码
					const parts = range.replace(/bytes=/, '').split('-')
					const start = parseInt(parts[0], 10)
					let end = parts[1] ? parseInt(parts[1], 10) : start + 999999

					// end 在最后取值为 fileSize - 1
					end = end > fileSize - 1 ? fileSize - 1 : end

					const chunksize = (end - start) + 1
					const file = fs.createReadStream(videoPath, {
						start,
						end
					})
					const head = {
						'Content-Range': `bytes ${start}-${end}/${fileSize}`,
						'Accept-Ranges': 'bytes',
						'Content-Length': chunksize,
						'Content-Type': 'video/mp4'
					}
					res.writeHead(206, head)
					file.pipe(res)
				} else {
					const head = {
						'Content-Length': fileSize,
						'Content-Type': 'video/mp4'
					}
					res.writeHead(200, head)
					fs.createReadStream(videoPath).pipe(res)
				}
			} else {
				const ffmpeg = require('fluent-ffmpeg')
				const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
				const ffprobePath = require('@ffprobe-installer/ffprobe').path
				ffmpeg.setFfmpegPath(ffmpegPath)
				ffmpeg.setFfprobePath(ffprobePath)
				ffmpeg()
					.input(videoPath)
					// read input at native framerate
					.nativeFramerate()
					.videoCodec(videoCodecSupport ? 'copy' : 'libx264')
					.audioCodec(audioCodecSupport ? 'copy' : 'aac')
					.format('mp4')
					.seekInput(0)
					// fragmeted mp4
					.outputOptions('-movflags', 'frag_keyframe+empty_moov')
					.pipe(res)
			}
			/!*
			const stat = fs.statSync(pathSrc)
			const fileSize = stat.size
			const range = req.headers.range
			console.log('req.headers:::', req.headers)
			if (range) {
				// 有range头才使用206状态码
				const parts = range.replace(/bytes=/, '').split('-')
				const start = parseInt(parts[0], 10)
				let end = parts[1] ? parseInt(parts[1], 10) : start + 999999

				// end 在最后取值为 fileSize - 1
				end = end > fileSize - 1 ? fileSize - 1 : end

				const chunksize = (end - start) + 1
				const file = fs.createReadStream(pathSrc, {
					start,
					end
				})
				const head = {
					'Content-Range': `bytes ${start}-${end}/${fileSize}`,
					'Accept-Ranges': 'bytes',
					'Content-Length': chunksize,
					'Content-Type': 'video/mp4'
				}
				res.writeHead(206, head)
				file.pipe(res)
			} else {
				const head = {
					'Content-Length': fileSize,
					'Content-Type': 'video/mp4'
				}
				res.writeHead(200, head)
				fs.createReadStream(pathSrc).pipe(res)
			}*!/
		}
	})
	app.use('/voice', (req, res, next) => {
		const pathSrc = (path.resolve(voicesPath, req.query.fileName))
		const stat = fs.statSync(pathSrc)
		const fileSize = stat.size
		const range = req.headers.range
		if (range) {
			// 有range头才使用206状态码
			const parts = range.replace(/bytes=/, '').split('-')
			const start = parseInt(parts[0], 10)
			let end = parts[1] ? parseInt(parts[1], 10) : start + 999999
			// end 在最后取值为 fileSize - 1
			end = end > fileSize - 1 ? fileSize - 1 : end

			const chunksize = (end - start) + 1
			const file = fs.createReadStream(pathSrc, {
				start,
				end
			})
			const head = {
				'Content-Range': `bytes ${start}-${end}/${fileSize}`,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunksize,
				'Content-Type': 'audio/x-mei-aac'
			}
			res.writeHead(206, head)
			file.pipe(res)
		} else {
			const head = {
				'Content-Length': fileSize,
				'Content-Type': 'audio/x-mei-aac'
			}
			res.writeHead(200, head)
			fs.createReadStream(pathSrc).pipe(res)
		}
	})
	var server = http.createServer(app)
	server.listen(0)
	server.on('listening', function() {
		var port = server.address().port
		global.serverPort = port
		console.log('listening', port)
	})
}
*/
