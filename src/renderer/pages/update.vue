<template>
	<div class="update">
		<div class="top">
			<div>
				{{$t('about.newVerFound')}}<br>
				<span>v{{params.version}}</span>
			</div>
		</div>
		<div class="update-body">
			<div class="content" v-html="params.description"></div>
			<!--<div @click="openWeb">alsdfasd</div>-->
			<div class="bottom">
				<div class="auto-update" style="padding-top: 10px;font-size: 14px;" v-show="updateState === 'install'">
					{{text}}
				</div>
				<div class="auto-update" v-show="updateState === 'downloading'">
					{{text}}。<a href="#" @click="openWeb">{{$t('about.downloadTip1')}}</a>
					<a-progress :percent="percent" style="width: 100%" :status="percent < 100 ? 'active' : 'success'" />
				</div>
				<a-button @click="exit" class="btn" v-show="updateState !== 'install'">
					{{params.upgrade === '1' ? $t('common.exitBtn') : $t('common.exitIM')}}
				</a-button>
				<a-button type="primary" class="btn" @click="startUpdate" v-show="!updateState">
					{{$t('about.updateNow')}}
				</a-button>
				<div style="clear: both"></div>
			</div>
		</div>
	</div>
</template>

<script>
	import { ipcRenderer } from 'electron'
	import { setLang } from '@/assets/lang'

	export default {
		name: 'Update',
		data() {
			return {
				percent: 0,
				text: this.$t('common.updatePackageDownloading'),
				updateState: '',
				params: {}
			}
		},
		methods: {
			async openWeb() {
				const	apiUrlConfig	=	await this.$utils.fun.getApiUrlConfig()
				this.$utils.fun.openExternal(apiUrlConfig.currentConfig.sms_download_url)
			},
			exit() {
				this.$utils.currentWindow.close()
			},
			startUpdate() {
				this.updateState = 'downloading'
				ipcRenderer.send('autoUpdate-download')
			}
		},
		created() {
			this.params = JSON.parse(this.$route.query.params)
			this.params.description = this.params.description.replace(/\n/g, '<br>')
			ipcRenderer.on('downstate', (event, arg) => {
				this.percent = Math.round(arg.percent * 100)
				this.text = arg.text
				this.updateState = arg.updateState
			})
			ipcRenderer.on('params', (event, arg) => {
				arg.description = arg.description.replace(/\n/g, '<br>')
				this.updateState = ''
				this.text = arg.text
				this.percent = 0
				this.params = arg
			})
			ipcRenderer.on('changeLang', (event, lang) => {
				setLang(lang)
				// this.handleClose()
			})
		},
		mounted() {
		}
	}
</script>

<style scoped lang="scss">
	.update{
		-webkit-app-region: no-drag;
		width: 505px;
		height: 432px;
		@include retinize('update-bg');
		.top{
			height: 167px;
			width: 460px;
			margin: auto;
			font-size: 25px;
			color:#F0F5FF;
			position: relative;
			-webkit-app-region: drag;
			overflow: auto;
			span{
				font-size:25px;
			}
			div{
				margin-top: 53px;
				margin-left: 95px;
			}
		}
		.update-body{
			width: 460px;
			margin: auto;
		}
		.content{
			height: 180px;
			padding: 0 20px 15px 20px;
			overflow: auto;
			word-break:break-all; /*支持IE，chrome，FF不支持*/
			word-wrap:break-word;/*支持IE，chrome，FF*/
			line-height: 180%;
		}
		.auto-update{
			width: 75%;
			margin-left: 10px;
			float: left;
			font-size: 12px;
		}
		.bottom{
			padding-bottom: 20px;
			.btn{
				float: right;
				margin-top: 2px;
				margin-right: 10px;
			}
		}
	}
</style>
