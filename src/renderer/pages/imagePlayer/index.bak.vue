<template>
	<player :title="title" :player-info="current" @params="handle" :player-type="$WEB_CONFIG.CHAT_MSG_TYPE.TYPE_IMAGE">
		<div slot="toolbar">
			<div class="image-toolbar lg-toolbar" id="toolbar" style="float: right"></div>
		</div>
		<template>
			<div class="image-container" id="image-container">
				<ul id="lightgallery"></ul>
			</div>
		</template>
	</player>
</template>

<script>
	import player from '@/components/player'
	import { ipcRenderer } from 'electron'
	import $ from 'jquery'
	import './lightgallery/js/lightgallery'
	import './lg-zoom-rotate/'
	import './lightgallery/css/lightgallery.css'

	export default {
		name: 'ImagePlayer',
		components: {
			player
		},
		data() {
			return {
				title: '分享的图片',
				$lg: null,
				current: {},
				imageArray: []
			}
		},
		async mounted() {
		},
		methods: {
			handle(payload) {
				this.$nextTick(async() => {
					if (!this.$lg) this.$lg = $('#lightgallery')
					if (this.$lg) {
						if (this.$lg.data('lightGallery')) {
							await this.$lg.data('lightGallery').destroy(true)
						}
						const dynamicEl = []
						let index = 0
						if (payload.imageArray && payload.burntAfterRead !== 1 && payload.imageArray.length) {
							this.imageArray = window._.assign([], payload.imageArray)
							this.imageArray.sort((a, b) => {
								return a.timestamp - b.timestamp
							})
							for (let i = 0; i < this.imageArray.length; i++) {
								// let filePath = this.imageArray[i].filePath
								if (this.imageArray[i].messageId === payload.messageId) {
									index = i
									// filePath = payload.filePath
								}
								dynamicEl.push({
									src: (/^(http|https):\/\//i).test(this.imageArray[i].filePath) ? this.imageArray[i].filePath : ('file://' + this.imageArray[i].filePath)
								})
							}
							this.current = this.imageArray[index]
						} else {
							this.imageArray = []
							dynamicEl.push({
								src: (/^(http|https):\/\//i).test(payload.filePath) ? payload.filePath : ('file://' + payload.filePath)
							})
							this.current = payload
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
