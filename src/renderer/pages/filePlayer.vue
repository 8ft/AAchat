<template>
	<div style="width: 100%; height: 100%;">
		<div v-if="res.code === 0" style="border-top: 1px solid #c5c5c5;height:100%;width:100%; display: flex; align-items: center;justify-content: center">
			<iframe :src="fileUrl" sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts" v-show="isSupportFileType && hasServerFileExist" ref="iframe" frameborder="0" height="100%" width="100%" @load="handleLoad"></iframe>
			<!--支持预览，服务器文件不可用，本地文件可用-->
			<div v-if="isSupportFileType && !hasServerFileExist && hasLocalFileExist">
				<div class="icon"></div>
				<div class="text">
					{{$t('common.filePreview[0]')}}<br>
					{{$t('common.filePreview[2]')}}
				</div>
			</div>
			<!--不支持预览，服务器文件可用，本地文件不可用-->
			<div v-if="!isSupportFileType && hasServerFileExist && !hasLocalFileExist">
				<div class="icon"></div>
				<div class="text">
					{{$t('common.filePreview[1]')}}<br>
					{{$t('common.filePreview[2]')}}
				</div>
			</div>
			<!--不支持预览，服务器文件可用-->
			<div v-if="!isSupportFileType && hasLocalFileExist">
				<div class="icon"></div>
				<div class="text">
					{{$t('common.filePreview[1]')}}<br>
					{{$t('common.filePreview[2]')}}
				</div>
			</div>
			<!--服务器文件不可用，本地文件不可用-->
			<div v-if="!hasServerFileExist && !hasLocalFileExist">
				<div class="icon"></div>
				<div class="text">
					{{$t('common.FileExpired')}}
				</div>
			</div>
		</div>
		<div v-else style="border-top: 1px solid #c5c5c5;height:100%;width:100%; display: flex; align-items: center;justify-content: center">
			<div>
				<div class="icon"></div>
				<div class="text" v-if="res.code === 2013">
					{{$t('common.FileExpired')}}
				</div>
				<div class="text" v-else>
					{{res.message}}
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'FilePlayer',
		data() {
			return {
				res: {
					code: 0
				},
				params: {},
				fileUrl: '',
				hasLocalFileExist: false,
				hasServerFileExist: false
			}
		},
		watch: {
			'$store.state.player.playerData': {
				handler(nVal) {
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
			console.log('file:::::')
			this.handle(this.$store.state.player.playerData)
		},
		computed: {
			isSupportFileType() {
				const ext = this.$utils.fun.getFileExtByPath(this.params.fileName)
				return this.$WEB_CONFIG.supportFileType.indexOf(ext.toLowerCase()) > -1
			}
		},
		methods: {
			handleLoad() {
				/*
				阅后即焚的操作交给会话切换
				if (this.params.isUnreadBurntAfterReadMsg) {
					this.params.opType = 'burntAfterRead'
					ipcRenderer.send('playerWin', this.params)
				}*/
			},
			async resetParams(payload) {
				this.params = window._.assign({}, this.params, payload)
				this.hasLocalFileExist = await this.$utils.fun.fileExist(this.params.filePath)
			},
			async handle(payload) {
				if (this.$store.state.player.playerData.playerType !== this.$CHAT_MSG_TYPE.TYPE_FILE) return
				this.params = payload
				this.params.playerType = this.$CHAT_MSG_TYPE.TYPE_FILE
				this.hasLocalFileExist = await this.$utils.fun.fileExist(this.params.filePath)
				this.hasServerFileExist = await this.$utils.fun.urlExist(this.params.url)
				if (this.isSupportFileType && this.hasServerFileExist) { // 支持的文件且服务器上文件可用
					this.$utils.chatSdk.cOfficeReadOnlyAsync(payload.messageId, payload.fileName, this.params.url).then(res => {
						this.res = res
						if (res.code === 0) {
							this.fileUrl = (/^(http|https):\/\//i).test(res.data) ? res.data : (this.$store.state.Setting.fileDomainURL + res.data)
						}
					})
				}
				setTimeout(() => { // 加上延时，否则player.vue里的watch监控不到
					this.$store.dispatch('OPcomponent/set_playerWinHide', false)
				}, 0)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.icon {
		width: 96px;
		height: 123px;
		margin: auto;
		@include retinize('err-file')
	}
	.text{
		font-size: 18px;text-align:center;margin-top: 15px;
	}
</style>
