<template>
	<div class="video-player">
		<div class="player" :style="'width:'+width+'px'">
			<div class="player-top">
				fasdfasd
			</div>
			<div class="player-content">
				<video id="video" :width="width" :height="height" preload controls="controls">
					<source :src="serverUrl" type="video/mp4">
				</video>
			</div>
		</div>
	</div>
</template>

<script>
	import { remote } from 'electron'

	export default {
		name: 'VideoPlay',
		data() {
			return {
				serverUrl: `http://localhost:${remote.getGlobal('serverPort')}/video?name=6C97DBAD9523728E3A27BCD2B879BF2B.mp4`,
				width: 0,
				height: 0
			}
		},
		mounted() {
			const _this = this
			const video = document.getElementById('video')
			video.onloadedmetadata = function() {
				const size = _this.$utils.imageOp.resizeImage(this.videoWidth, this.videoHeight, 800, 440)
				// console.log(size)
				_this.width = parseInt(size.width)
				_this.height = parseInt(size.height)
				console.log(this.width + 'x' + this.height)
				console.log(this.videoWidth + 'x' + this.videoHeight)
			}
		}
	}
</script>

<style scoped lang="scss">
  .video-player {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    background: rgba(0, 0, 0, .5);
    .player {
      height: auto;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      text-align: center;
      .player-top {
        height: 60px;
        border-bottom: 1px solid #ccc;
      }
      .player-content {
        width: 100%;
        background: #000;
      }
    }
  }
</style>
