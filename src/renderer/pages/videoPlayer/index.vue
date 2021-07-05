<template>
	<video id="video" v-if="url" ref="video" width="100%" height="100%" preload controls autoplay :muted="muted">
		<source :src="url" type="video/mp4">
	</video>
</template>

<script>
	import utils from '~/utils/'

	export default {
		name: 'VideoPlayer',
		watch: {
			'$store.state.player.playerData': {
				handler(nVal) {
					this.handle(this.$store.state.player.playerData)
				},
				deep: true
			}
		},
		data() {
			return {
				muted: false,
				url: '',
				serverPort: this.$utils.fun.getGlobalByName('serverPort')
			}
		},
		mounted() {
			console.log('video::::::')
			this.handle(this.$store.state.player.playerData)
		},
		methods: {
			handle(payload) {
				if (this.$store.state.player.playerData.playerType !== this.$CHAT_MSG_TYPE.TYPE_VIDEO) {
					this.url = ''
					return
				}
				this.muted = payload.mute === true
				this.url = (/^(http|https):\/\//i).test(payload.filePath) ? payload.filePath : (`http://localhost:${this.serverPort}/video/${utils.md5(payload.messageId)}/${encodeURIComponent(payload.filePath)}`)
				setTimeout(() => { // 加上延时，否则player.vue里的watch监控不到
					this.$refs.video.play()
					this.$store.dispatch('OPcomponent/set_playerWinHide', false)
				}, 0)
			}
		}
	}
</script>

<style lang="scss" scoped>
	video {
		background:#000;
		outline: none;
		-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
	}
</style>
