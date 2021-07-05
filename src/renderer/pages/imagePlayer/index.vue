<template>
	<div class="image-container" id="image-container">
		<ul id="lightgallery"></ul>
	</div>
</template>

<script>
	import { ipcRenderer } from 'electron'
	import $ from 'jquery'
	import './lightgallery/js/lightgallery'
	import './lg-zoom-rotate/'
	import './lightgallery/css/lightgallery.css'

	export default {
		name: 'ImagePlayer',
		data() {
			return {
				$lg: null,
				current: {},
				imageArray: []
			}
		},
		watch: {
			'$store.state.player.playerData': {
				handler(nVal) {
					console.log('image::::watch')
					this.handle(nVal)
				},
				deep: true
			}
		},
		async mounted() {
			/* ipcRenderer.on('params', async(event, payload) => {
				console.log(payload)
				this.handle(payload)
			})*/
			console.log('image:::::')
			this.handle(this.$store.state.player.playerData)
		},
		methods: {
			handle(payload) {
				if (this.$store.state.player.playerData.playerType !== this.$CHAT_MSG_TYPE.TYPE_IMAGE) return
				console.log('imageArray:::', payload.imageArray)
				this.$nextTick(async() => {
					if (!this.$lg) this.$lg = $('#lightgallery')
					if (this.$lg) {
						if (this.$lg.data('lightGallery')) {
							await this.$lg.data('lightGallery').destroy(true)
						}
						let dynamicEl = []
						let index = 0
						if (payload.imageArray && payload.burntAfterRead !== 1 && payload.imageArray.length) {
							this.imageArray = window._.assign([], payload.imageArray)
							this.imageArray.sort((a, b) => {
								return a.timestamp - b.timestamp
							})
							for (let i = 0; i < this.imageArray.length; i++) {
								// let filePath = this.imageArray[i].filePath
								if (this.imageArray[i].messageId === payload.messageId || this.imageArray[i].filePath === payload.filePath) {
									index = i
									// filePath = payload.filePath
								}
								dynamicEl.push({
									src: (/^(http|https):\/\//i).test(this.imageArray[i].filePath) ? this.imageArray[i].filePath : ('file://' + this.imageArray[i].filePath)
								})
							}
						}
						// 数组里找不到图片，则显示当前图
						if (dynamicEl.length === 0) {
							this.imageArray = []
							dynamicEl = [{
								src: (/^(http|https):\/\//i).test(payload.filePath) ? payload.filePath : ('file://' + payload.filePath)
							}]
							this.current = payload
						} else {
							this.current = this.imageArray[index]
						}
						this.$lg.lightGallery({
							container: '#image-container',
							toolContainer: '#toolbar',
							closable: false,
							dynamic: true,
							loop: false,
							dynamicEl,
							rotate: true,
							download: payload.burntAfterRead === 0,
							index,
							imgLoadErrorPath: ',=',
							counter: false
						})
						setTimeout(() => {
							this.$lg.on('onBeforePrevSlide.lg', (event, index, fromTouch) => {
								console.log('onBeforePrevSlide.lg:::', index)
								this.changeCurrent(index)
							})
							this.$lg.on('onBeforeNextSlide.lg', (event, index, fromTouch) => {
								console.log('onBeforeNextSlide.lg:::', index)
								this.changeCurrent(index)
							})
						}, 100)
						this.$store.dispatch('OPcomponent/set_playerWinHide', false)
					}
				})
			},
			changeCurrent(index) {
				this.current = this.imageArray[index]
				ipcRenderer.send('playerWin', {
					opType: 'changePlayerId',
					messageId: this.current.messageId,
					senderId: this.current.senderId,
					playerType: this.$WEB_CONFIG.CHAT_MSG_TYPE.TYPE_IMAGE
				})
			}
		}
	}
</script>

<style lang="scss">
	.image-container{
		border-top: 1px solid #c5c5c5;
		height: 100%;
		background:#ececec!important;
		position: relative;
	}
	.image-toolbar{
		width: auto;
		padding-right: 20px;
		.lg-rotate{
			color: #999;
			cursor: pointer;
			float: right;
			font-size: 24px;
			height: 47px;
			line-height: 27px;
			padding: 10px 0;
			text-align: center;
			width: 40px;
			text-decoration: none !important;
			outline: medium none;
			transition: color 0.2s linear;
			&:hover {
				color: #2E87FF;
			}
		}
	}
	.lg-backdrop{
		background: transparent;
	}
</style>
