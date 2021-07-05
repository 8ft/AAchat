<template>
	<div class="real-audio-win">
		<div class="top">
			<a-avatar class="avatar avatargerenbg" :src="params.userAvatar"></a-avatar>
			<div class="name-info">
				<p :title="params.userName">
					{{params.userName}}
				</p>
				<span v-if="params.cForm === $CHAT_MSG_TYPE.TYPE_REALAUDIO_AGREE">
					通话中
				</span>
				<!--发送方-->
				<template v-if="params.isSend">
					<span v-if="params.cForm === $CHAT_MSG_TYPE.TYPE_REALAUDIO_REQUEST">
						正在呼叫对方
					</span>
					<span v-if="params.cForm === $CHAT_MSG_TYPE.TYPE_REALAUDIO_BUSY">
						对方正在语音中
					</span>
					<span v-if="params.cForm === $CHAT_MSG_TYPE.TYPE_REALAUDIO_TIMEOUT">
						对方未接听
					</span>
				</template>
				<template v-else>
					<span v-if="params.cForm === $CHAT_MSG_TYPE.TYPE_REALAUDIO_REQUEST">
						正在接通
					</span>
				</template>
			</div>
		</div>
		<div class="bottom">
			<div class="left">
				<div class="call-phone iconfont iconmaikefeng-- phone"></div>
				{{callTime}}
			</div>
			<audio ref="realAudioPlayer1" />
			<audio ref="realAudioPlayer2" />
			<!--接听震铃声音-->
			<audio :src="ring" preload ref="ringSound" loop />
			<!--发送震铃声音-->
			<audio :src="dudu" preload ref="callSound" loop />
			<div class="right">
				<!--<button @click="startCall">
					开始
				</button>
				<button @click="test">
					合并播放
				</button>-->
				<div class="call-phone iconfont iconphone-" @click="endCall"></div>
				<div
					class="call-phone iconfont iconphone- start"
					v-if="params.cForm === $CHAT_MSG_TYPE.TYPE_REALAUDIO_REQUEST && !params.isSend"
					@click="RealAudioPass"
				></div>
			</div>
		</div>
	</div>
</template>

<script>
	import { ipcRenderer } from 'electron'
	import ring from '@/assets/sound/ring.mp3'
	import dudu from '@/assets/sound/dudu.mp3'
	import Recorder from 'recorder-core'
	import 'recorder-core/src/engine/wav'

	export default {
		name: 'RealAudio',
		components: {},

		data() {
			return {
				params: {},
				status: '',
				ring,
				dudu,
				audioURL: '',
				mediaStreamTrack: null,
				audioContextStream: null,
				audioSource: null,
				callTime: '',
				timer: null,
				timeCount: 0,
				audioBuffer: [],
				interval: null,
				rec: null,
				realTimeSendTryTime: 0,
				realTimeSendTryType: '',
				realTimeSendTryEncBusy: 0,
				realTimeSendTryNumber: 0,
				transferUploadNumberMax: 0,
				realTimeSendTryChunk: null,
				sendInterval: 50,
				sampleRate: 44100,
				bitRate: 16,
				mergeData: null
			}
		},
		watch: {
			'params.cForm'(cForm) {
				console.log('cForm::::', cForm)
				switch (cForm) {
				case this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_REQUEST:
					if (this.params.isSend) {
						this.$refs.callSound.currentTime = 0
						this.$refs.callSound.play()
						this.$utils.chatSdk.cRealAudioCall(this.params.threadId, JSON.stringify(this.params.meta))
					} else {
						this.$refs.ringSound.currentTime = 0
						this.$refs.ringSound.play()
					}
					break
				case this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_AGREE:
					this.$refs.ringSound.pause()
					this.$refs.callSound.pause()
					this.callTimer()
					this.startCall()
					this.realAudioPlay()
					this.receiveData()
					break
				case this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_END:
					if (this.audioURL) window.URL.revokeObjectURL(this.audioURL)
					this.audioURL = ''
					this.rec.close()
					this.realTimeSendTry(this.rec, true)
					this.$refs.ringSound.pause()
					this.$refs.callSound.pause()
					this.$utils.chatSdk.cRealAudioDone(this.params.threadId, JSON.stringify(this.params.meta))
					this.$utils.currentWindow.close()
					break
				case this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_REJECT:
					this.stopMediaStream()
					this.$refs.ringSound.pause()
					this.$refs.callSound.pause()
					this.$utils.chatSdk.cRealAudioReject(this.params.threadId, JSON.stringify(this.params.meta))
					this.$utils.currentWindow.close()
					break
				case this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_BUSY:
					this.$refs.ringSound.pause()
					this.$refs.callSound.pause()
					// this.$utils.currentWindow.close()
					break
				case this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_CANCEL:
					this.$refs.ringSound.pause()
					this.$refs.callSound.pause()
					this.$utils.chatSdk.cRealAudioCancel(this.params.threadId, JSON.stringify(this.params.meta))
					this.$utils.currentWindow.close()
					break
				}
			}
		},
		methods: {
			realTimeSendTryReset(type) {
				this.realTimeSendTryType = type
				this.realTimeSendTryTime = 0
			},
			async realTimeSendTry(rec, isClose) {
				const t1 = this.$utils.fun.getServerTime('realTimeSendTry')
				const _self = this
				if (this.realTimeSendTryTime == 0) {
					this.realTimeSendTryTime = t1
					this.realTimeSendTryEncBusy = 0
					this.realTimeSendTryNumber = 0
					this.transferUploadNumberMax = 0
					this.realTimeSendTryChunk = null
				}
				if (!isClose && t1 - this.realTimeSendTryTime < this.sendInterval) {
					return// 控制缓冲达到指定间隔才进行传输
				}
				this.realTimeSendTryTime = t1
				const number = ++this.realTimeSendTryNumber

				// 借用SampleData函数进行数据的连续处理，采样率转换是顺带的
				const chunk = Recorder.SampleData(rec.buffers, rec.srcSampleRate, this.sampleRate, this.realTimeSendTryChunk, { frameType: isClose ? '' : this.realTimeSendTryType })

				// 清理已处理完的缓冲数据，释放内存以支持长时间录音，最后完成录音时不能调用stop，因为数据已经被清掉了
				for (let i = this.realTimeSendTryChunk ? this.realTimeSendTryChunk.index : 0; i < chunk.index; i++) {
					rec.buffers[i] = null
				}
				this.realTimeSendTryChunk = chunk

				// 没有新数据，或结束时的数据量太小，不能进行mock转码
				if (chunk.data.length == 0 || isClose && chunk.data.length < 2000) {
					this.transferUpload(number, null, 0, null, isClose)
					return
				}

				// 实时编码队列阻塞处理
				if (!isClose) {
					if (this.realTimeSendTryEncBusy >= 2) {
						console.log('编码队列阻塞，已丢弃一帧', 1)
						return
					}
				}
				this.realTimeSendTryEncBusy++

				// 通过mock方法实时转码成mp3、wav
				const encStartTime = this.$utils.fun.getServerTime()
				const recMock = Recorder({
					type: this.realTimeSendTryType,
					sampleRate: this.sampleRate, // 采样率
					bitRate: this.bitRate // 比特率
				})
				recMock.mock(chunk.data, chunk.sampleRate)
				recMock.stop(function(blob, duration) {
					_self.realTimeSendTryEncBusy && (_self.realTimeSendTryEncBusy--)
					blob.encTime = this.$utils.fun.getServerTime() - encStartTime

					// 转码好就推入传输
					_self.transferUpload(number, blob, duration, recMock, isClose)
				}, function(msg) {
					_self.realTimeSendTryEncBusy && (_self.realTimeSendTryEncBusy--)

					// 转码错误？没想到什么时候会产生错误！
					console.log('不应该出现的错误:' + msg, 1)
				})
			},
			transferUpload(number, blobOrNull, duration, blobRec, isClose) {
				const _self = this
				this.transferUploadNumberMax = Math.max(this.transferUploadNumberMax, number)
				if (blobOrNull) {
					const blob = blobOrNull
					const encTime = blob.encTime

					//* ********Read As Base64***************
					const reader = new FileReader()
					reader.onloadend = async function() {
						const base64 = (/.+;\s*base64\s*,\s*(.+)$/i.exec(reader.result) || [])[1]
						const cSendRealBase64 = await _self.$utils.chatSdk.cSendRealBase64(base64)
						console.log('cSendRealBase64:::', cSendRealBase64)
						// _self.audioBuffer.push(base64)
					}
					reader.readAsDataURL(blob)
					const numberFail = number < this.transferUploadNumberMax ? '<span style="color:red">顺序错乱的数据，如果要求不高可以直接丢弃，或者调大SendInterval试试</span>' : ''
					const logMsg = 'No.' + (number < 100 ? ('000' + number).substr(-3) : number) + numberFail

					console.log(blob, duration, blobRec, logMsg + '花' + ('___' + encTime).substr(-3) + 'ms')
				}

				if (isClose) {
					console.log('No.' + (number < 100 ? ('000' + number).substr(-3) : number) + ':已停止传输')
				}
			},
			startCall() {
				console.log('start call')
				if (this.rec) this.rec.close()
				const _self = this
				this.rec = Recorder({
					type: 'unknown',
					onProcess: function(buffers, powerLevel, bufferDuration, bufferSampleRate, newBufferIdx, asyncEnd) {
						_self.realTimeSendTry(_self.rec, false)
					}
				})
				this.rec.open(function() {
					_self.rec.start()
					_self.realTimeSendTryReset('wav')
				}, function(msg, isUserNotAllow) { // 用户拒绝未授权或不支持
					// dialog&&dialog.Cancel(); 如果开启了弹框，此处需要取消
					console.log((isUserNotAllow ? 'UserNotAllow，' : '') + '无法录音:' + msg)
				})
			},
			changeAudio() {
				this.realAudioPlay()
			},
			async realAudioPlay() { // 播放收到的音频
				if (this.params.cForm === this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_END) return
				const itm = this.audioBuffer.pop()
				if (itm) {
					const audio = this.$refs.realAudioPlayer1
					const blob = this.$utils.mediaStream.base64toBlob(itm)
					console.log('receiveData:::', blob)
					audio.src = window.URL.createObjectURL(blob)
					// audio.play()
					audio.play().then(() => {
						setTimeout(() => {
							// 后续操作
							console.log('done:::', audio.duration)
							this.realAudioPlay()
						}, audio.duration * 1000) // audio.duration 为音频的时长单位为秒
					}).catch((e) => {
						console.log('Operation is too fast, audio play fails:::', e)
					})
				} else {
					setTimeout(() => {
						this.realAudioPlay()
					}, 0)
				}
				/* let rtcAudioPlay1
				let rtcAudioPlay2
				let rtcAudioPlayCur
				// var rtcAudioPlayPrev
				let rtcAudioPlayItm
				let rtcAudioPlayNextTime
				let rtcAudioPlayID = 0
				let rtcAudioPlayTime = 0
				const rtcAudioPlayTimeSkips = [0, 0, 0]
				let rtcAudioPlayTimeSkip = 0
				const _self = this
				let Interval = null
				const rtcAudioPlay = function() {
					if (!rtcAudioPlay1) {
						rtcAudioPlay1 = _self.$refs.realAudioPlayer1
						rtcAudioPlay2 = _self.$refs.realAudioPlayer2

						Interval = setInterval(function() { // audio currentTime精度太低，暴力计算
							if (!_self.hasRealPlaying) {
								if (Interval) clearInterval(Interval)
								Interval = null
								return
							}
							const audio = rtcAudioPlayCur
							if (audio.rtcPlayID != rtcAudioPlayID) {
								return
							}
							if (rtcAudioPlayNextTime <= this.$utils.fun.getServerTime() + 3) {
								audio.rtcPlayID = -1
								rtcAudioPlay()
							}
						}, 6)
						// 计算从开始播放到发出声音的延迟
						rtcAudioPlay1.onplaying = rtcAudioPlay2.onplaying = function(e) {
							const audio = e.target
							audio.rtcPlayID = rtcAudioPlayID
							rtcAudioPlayTimeSkips.splice(0, 0, this.$utils.fun.getServerTime() - rtcAudioPlayTime)
							rtcAudioPlayTime = this.$utils.fun.getServerTime()

							if (rtcAudioPlayTimeSkips.length > 3) {
								rtcAudioPlayTimeSkips.length = 3
							}

							rtcAudioPlayTimeSkip = (rtcAudioPlayTimeSkips[0] + rtcAudioPlayTimeSkips[1] + rtcAudioPlayTimeSkips[2]) / 3

							// 不关闭上一个，让它继续播放完结尾，衔接起来好些
							// rtcAudioPlayPrev&&rtcAudioPlayPrev.pause();

							var sd = audio.duration * 1000
							console.log('audio.duration:::', audio.duration)
							var pd = rtcAudioPlayItm.duration
							var duration = sd
							var skip = 0
							if (pd < sd) { // 编码器并不一定精确时间的编码，mp3首尾有静默但长度未知
								duration = pd
								// 分别跳过首尾（其实保留尾）
								skip = (sd - pd) / 2
							}

							rtcAudioPlayNextTime = this.$utils.fun.getServerTime() + duration - skip - rtcAudioPlayTimeSkip
						}
					}

					if (_self.audioBuffer.length < 1) {
						return
					}
					if (rtcAudioPlayCur && rtcAudioPlayCur.rtcPlayID != -1) {
						return
					}

					rtcAudioPlayCur = rtcAudioPlayCur == rtcAudioPlay1 ? rtcAudioPlay2 : rtcAudioPlay1
					// rtcAudioPlayPrev = rtcAudioPlayCur == rtcAudioPlay2 ? rtcAudioPlay1 : rtcAudioPlay2

					rtcAudioPlayID++
					rtcAudioPlayCur.rtcPlayID = 0

					rtcAudioPlayTime = this.$utils.fun.getServerTime()
					var itm = _self.audioBuffer.pop()
					rtcAudioPlayItm = itm
					const arrayBuffer = new Float32Array(_self.$utils.mediaStream.base64ToArrayBuffer(itm.data))
					const blob = _self.$utils.mediaStream.pcmToWav(arrayBuffer)
					console.log('blob:::', blob)
					rtcAudioPlayCur.src = window.URL.createObjectURL(blob)
					rtcAudioPlayCur.play()
				}
				rtcAudioPlay()*/
			},
			callTimer() {
				this.timer = setInterval(() => {
					this.callTime = this.$root.$options.filters.timeMeter(this.timeCount++)
					if (this.params.cForm === this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_END) {
						if (this.timer) clearInterval(this.timer)
						this.audioBuffer = []
						this.callTime = ''
						this.timeCount = 0
					}
				}, 1000)
			},
			WavMerge(fileBytesList, True, False) {
				console.log('fileBytesList[0]:::', fileBytesList[0])
				var wavHead = new Uint8Array(fileBytesList[0].buffer.slice(0, 44))

				// 计算所有文件的长度、校验wav头
				var size = 0; var baseInfo
				for (let i = 0; i < fileBytesList.length; i++) {
					var file = fileBytesList[i]
					var info = this.readWavInfo(file)
					if (!info) {
						False && False('第' + (i + 1) + '个文件不是单声道wav raw pcm格式音频，无法合并')
						return
					};
					baseInfo || (baseInfo = info)
					if (baseInfo.sampleRate != info.sampleRate || baseInfo.bitRate != info.bitRate) {
						False && False('第' + (i + 1) + '个文件位数或采样率不一致')
						return
					};

					size += file.byteLength - 44
				}
				if (size > 50 * 1024 * 1024) {
					False && False('文件大小超过限制')
					return
				}

				// 去掉wav头后全部拼接到一起
				var fileBytes = new Uint8Array(44 + size)
				var pos = 44
				for (let i = 0; i < fileBytesList.length; i++) {
					var pcm = new Uint8Array(fileBytesList[i].buffer.slice(44))
					fileBytes.set(pcm, pos)
					pos += pcm.byteLength
				}

				// 添加新的wav头，直接修改第一个的头就ok了
				this.write32(wavHead, 4, 36 + size)
				this.write32(wavHead, 40, size)
				fileBytes.set(wavHead, 0)

				// 计算合并后的总时长
				var duration = Math.round(size / info.sampleRate * 1000 / (info.bitRate == 16 ? 2 : 1))

				True(fileBytes, duration, baseInfo)
			},
			write32(bytes, pos, int32) {
				bytes[pos] = (int32) & 0xff
				bytes[pos + 1] = (int32 >> 8) & 0xff
				bytes[pos + 2] = (int32 >> 16) & 0xff
				bytes[pos + 3] = (int32 >> 24) & 0xff
			},
			readWavInfo(bytes) {
				// 检测wav文件头
				if (bytes.byteLength < 44) {
					return null
				}
				var wavView = bytes
				var eq = function(p, s) {
					for (var i = 0; i < s.length; i++) {
						if (wavView[p + i] != s.charCodeAt(i)) {
							return false
						}
					}
					return true
				}
				if (eq(0, 'RIFF') && eq(8, 'WAVEfmt ')) {
					if (wavView[20] == 1 && wavView[22] == 1) { // raw pcm 单声道
						var sampleRate = wavView[24] + (wavView[25] << 8) + (wavView[26] << 16) + (wavView[27] << 24)
						var bitRate = wavView[34] + (wavView[35] << 8)
						return {
							sampleRate: sampleRate,
							bitRate: bitRate
						}
					}
				}
				return null
			},
			async test() {
				this.rec.close()
				console.log(this.audioBuffer)
				const _self = this
				if (!this.audioBuffer.length) {
					// console.log('至少需要录1段wav' + (exclude ? '，已排除' + exclude + '个非wav文件' : ''), 1)
					return
				}
				const audioBuffer = []
				for (let i = 0; i < this.audioBuffer.length; i++) {
					audioBuffer.push(new Uint8Array(await this.$utils.mediaStream.base64ToArrayBuffer(this.audioBuffer[i])))
				}
				console.log('audioBuffer:::', audioBuffer.length)
				this.WavMerge(audioBuffer, function(file, duration, info) {
					console.log('合并' + audioBuffer.length + '个成功', 2)
					info.type = 'wav'
					_self.mergeData = new Blob([file.buffer], { type: 'audio/wav' })
					_self.$refs.realAudioPlayer1.src = window.URL.createObjectURL(_self.mergeData)
					_self.$refs.realAudioPlayer1.play()
				}, function(msg) {
					console.log(msg + '，请清除日志后重试', 1)
				})
			},
			receiveData() {
				if (this.params.cForm !== this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_AGREE) return
				this.$utils.chatSdk.cReadRealBase64Async().then(async res => {
					if (this.audioSource) {
						// this.audioSource.stop()
						// this.audioSource = null
					}
					if (res !== '0') {
						// const wavData = this.$utils.mediaStream.pcmToWav(arrayBuffer)
						/* this.audioBuffer.push({
							duration: 0.23,
							data: res
						})*/
						// this.audioBuffer.splice(0, 0, { data: res, duration: 0.04644 })
						this.audioBuffer.splice(0, 0, res)
						// this.audioSource = this.$utils.mediaStream.playAudioByBuffer(wavData.buffer)
					} else {
						// console.log('123:::::', res)
					}
					setTimeout(() => {
						this.receiveData()
					}, 100)
				})
			},
			stopMediaStream() {
				if (this.mediaStreamTrack) {
					this.mediaStreamTrack.getTracks().forEach(function(track) {
						track.stop()
					})
					this.mediaStreamTrack = null
				}
				if (this.audioContextStream) {
					this.audioContextStream.close().then(() => {
						this.audioContextStream = null
					})
				}
			},
			endCall() {
				if (this.params.cForm === this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_BUSY) {
					this.$utils.currentWindow.close()
					return
				}
				if (this.params.isSend) {
					if (this.params.cForm === this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_REQUEST) {
						this.params.cForm = this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_CANCEL
					} else if (this.params.cForm === this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_AGREE) {
						this.params.cForm = this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_END
					}
				} else {
					if (this.params.cForm === this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_REQUEST) {
						this.params.cForm = this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_REJECT
					} else if (this.params.cForm === this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_AGREE) {
						this.params.cForm = this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_END
					}
				}
			},
			RealAudioPass() {
				this.$utils.chatSdk.cRealAudioPass(this.params.threadId, JSON.stringify(this.params.meta), this.params.content)
				this.params.cForm = this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_AGREE
			}
		},
		mounted() {
			console.log(':::::::::::::::realAudioWin::::::::::::')
			ipcRenderer.on('params', (e, payload) => {
				this.params = payload
				console.log('payload:::', payload)
				document.title = '与' + payload.userName + '语音通话'
			})
			console.log(window.MediaRecorder.isTypeSupported('audio/webm;codecs=pcm'))
			/* this.$utils.mediaStream.getUserMedia({ video: false, audio: true }, stream => {
				this.audioContextStream = this.$utils.mediaStream.getAudioStreamByAudioContext(stream, async arrayBuffer => {
					// const base64 = await this.$utils.mediaStream.int16ArrayToBase64(arraybuffer)
					// await this.$utils.chatSdk.cSendRealBase64(base64)
					/!* const buffer = this.$utils.mediaStream.arrayBufferToBuffer(int16Array)
					console.log('send-buffer:::', buffer)
					const base64 = buffer.toString('base64')
					await this.$utils.chatSdk.cSendRealBase64(base64)*!/
					console.log('原始::::', arrayBuffer)
					const base64 = this.$utils.mediaStream.arrayBufferToBase64(arrayBuffer)
					const temp = this.$utils.mediaStream.base64ToArrayBuffer(base64)
					console.log('转换后:::', temp)
				})
			})*/
			/* this.$utils.mediaStream.getUserMedia({ video: false, audio: true },
				stream => {
					this.mediaStreamTrack = stream
					this.$utils.mediaStream.getAudioStream(stream, async blob => {
						console.log(blob.data)
						let base64 = await this.$utils.mediaStream.blobToDataURL(blob.data)
						const index = base64.indexOf(',')
						base64 = base64.slice(index + 1)
						this.$utils.chatSdk.cSendRealBase64(base64)
						/!* const size = blob.data.size
						const SLICE_SIZE = 1000
						const p = Math.ceil(size / SLICE_SIZE)
						for (let i = 0; i < p; i++) {
							const start = i * SLICE_SIZE
							// 计算分片结束位置
							let end = start + SLICE_SIZE
							if (end > size) {
								end = size
							}
							const newBlob = blob.data.slice(start, end, 'audio/webm;codecs=pcm')
							let base64 = await this.$utils.mediaStream.blobToDataURL(newBlob)
							const index = base64.indexOf(',')
							base64 = base64.slice(index + 1)
							console.log('base64::::', base64)
							// await this.$utils.chatSdk.cSendRealBase64(base64)
						}*!/
						/!* this.$utils.mediaStream.blobToDataURL(blob.data).then(base64 => {
							const index = base64.indexOf(',')
							base64 = base64.slice(index + 1)
							// console.log(base64)
							// this.$utils.fun.fsLog(base64)
							console.log('123123:::', base64.length)
							this.$utils.chatSdk.cSendRealBase64(base64)
						})*!/
						// console.log('response::::', this.$utils.mediaStream.arrayBufferToBase64(data.buffer))
						// this.$utils.fun.fsput(this.arrayBufferToBase64(data.buffer))
						// this.$utils.chatSdk.cSendRealBase64(this.$utils.mediaStream.arrayBufferToBase64(data.buffer))
					})
				},
				err => {
					console.log(`访问用户媒体设备失败${err.name}, ${err.message}`)
					this.$message.error(`访问用户媒体设备失败${err.name}, ${err.message}`)
				}
			)*/
		}
	}
</script>

<style scoped lang="scss">
.real-audio-win{
	width: 100%;
	height: 100%;
	.top{
		height: 100px;
		border-bottom: 1px solid #E6E6E6;
		display: flex;
		align-items: center;
		padding: 0 30px;
		.avatar{
			width: 66px;
			height: 66px
		}
		.name-info{
			padding-left: 15px;
			p{
				width: 285px;
				font-size: 18px;
				color: #333;
				padding: 0 0 5px 0;
				margin: 0;
				white-space: nowrap;
				text-overflow: ellipsis;
				overflow: hidden;
				word-break: break-all;
			}
			span{
				color: #999;
			}
		}
	}
	.bottom{
		height: 70px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 30px;
		.left{
			display: flex;
			align-items: center;
		}
		.call-phone{
			float: left;
			width:36px;
			height:36px;
			border-radius: 50%;
			background:#f00;
			display: flex;
			align-items: center;
			justify-content: center;
			color: #fff;
			font-size: 23px;
			cursor:pointer;
			-webkit-app-region: no-drag;
			&.start{
				margin-left: 15px;
				background: #52bc6f;
				transform: rotateZ(-140deg);
			}
			&.phone{
				color: #999;
				border: 1px solid #999;
				background: #fff;
				cursor: default;
				margin-right: 10px;
			}
		}
	}
}
</style>
