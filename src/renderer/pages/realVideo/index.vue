<template>
	<div class="real-video">
		<video ref="mainVideo"></video>
		<div class="sub-video">
			<video ref="subVideo"></video>
		</div>
		<div class="btns">
			<a-tooltip placement="top" :title="'扬声器'">
				<div class="btn iconfont" @click="speakBtn"
					:class="{'start': isStart, 'iconshengyin-': speak, 'iconshengyin-jinzhi-': !speak}"
				></div>
			</a-tooltip>
			<a-tooltip placement="top" :title="'麦克风'">
				<div class="btn iconfont" @click="micBtn"
					:class="{'start': isStart, 'iconmaikefeng--': mic, 'iconmaikefeng-jinzhi-': !mic}"
				></div>
			</a-tooltip>
			<a-tooltip placement="top" :title="'摄像头'">
				<div class="btn iconfont" @click="cameraBtn"
					:class="{'start': isStart, 'iconshexiangtou-': camera, 'iconshexiangtou-jingzhi-': !camera}"
				></div>
			</a-tooltip>
			<a-tooltip placement="top" :title="'挂断'">
				<div class="btn iconfont iconphone-" @click="closeRealVideoWin"></div>
			</a-tooltip>
		</div>
	</div>
</template>

<script>
	import { ipcRenderer } from 'electron'

	export default {
		name: 'Index',
		data() {
			return {
				speak: true,
				mic: true,
				camera: true,
				off: true,
				isStart: false
			}
		},
		mounted() {
			ipcRenderer.on('getVideoStream', (e, arg) => {
				console.log(Buffer.alloc(arg.length, arg, 'base64'))
			})
			this.openVideo(this.$refs.mainVideo)
			this.openVideo(this.$refs.subVideo)
		},
		methods: {
			openVideo(videoPlayer) {
				this.getUserMedia({ video: true, audio: true },
					stream => {
						// 兼容webkit核心浏览器
						// const CompatibleURL = window.URL || window.webkitURL
						// 将视频流设置为video元素的源
						this.getVideoStream(stream)
						// video.src = CompatibleURL.createObjectURL(stream);
						videoPlayer.srcObject = stream
						videoPlayer.play()
					},
					this.error
				)
			},
			cameraBtn() {
				this.camera = !this.camera
			},
			speakBtn() {
				this.speak = !this.speak
			},
			micBtn() {
				this.mic = !this.mic
			},
			closeRealVideoWin() {
				this.$utils.currentWindow.close()
			},
			getUserMedia(constraints, success, error) {
				if (navigator.mediaDevices.getUserMedia) {
					// 最新的标准API
					navigator.mediaDevices.getUserMedia(constraints).then(success).catch(error)
				} else if (navigator.webkitGetUserMedia) {
					// webkit核心浏览器
					navigator.webkitGetUserMedia(constraints, success, error)
				} else if (navigator.mozGetUserMedia) {
					// firfox浏览器
					navigator.mozGetUserMedia(constraints, success, error)
				} else if (navigator.getUserMedia) {
					// 旧版API
					navigator.getUserMedia(constraints, success, error)
				}
			},
			getVideoStream(localStream) {
				const mediaRecorder = new MediaRecorder(localStream)
				mediaRecorder.ondataavailable = async(blob) => {
				}
				mediaRecorder.start(1000)
			},
			blobToBuffer(blob) {
				return new Promise((resolve, reject) => {
					var reader = new FileReader()
					reader.readAsText(blob, 'base64')
					reader.onload = (e) => {
						resolve(reader.result)
					}
				})
			},
			error(err) {
				console.log(`访问用户媒体设备失败${err.name}, ${err.message}`)
				this.$message.error(`访问用户媒体设备失败${err.name}, ${err.message}`)
			}
		}
	}
</script>

<style scoped lang="scss">
  .real-video {
    height: 100%;
    width: 100%;
    background: #e3e3e3;
    video {
      transform: rotate3d(0, 1, 0, 180deg);
      width: 100%;
      height: 100%;
    }
    .sub-video {
      width: 140px;
      position: absolute;
      right: 40px;
      top: 100px;
      video {
        background: #000;
        height: 140px;
        border: 2px solid #fff;
      }
    }
    .btns {
      position: absolute;
      bottom: 40px;
      width: 100%;
      text-align: center;
      .btn {
        -webkit-app-region: no-drag;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        cursor: pointer;
        background: #666;
        margin-left: 30px;
        font-size: 30px;
        color: #999;
        transition: background .3s;
        &:first-child {
          margin-left: 0;
        }
        &.start {
          background: #fff;
        }
      }
      .iconphone- {
        background: #FF664D;
        color: #fff;
      }
    }
  }
</style>
