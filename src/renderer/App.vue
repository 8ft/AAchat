<template>
	<div id="app" :class="[{'web': isWeb}, $PROJECT_NAME, {'Windowscss': $utils.os.isWindows, 'maccss': $utils.os.isMac}]">
		<a-spin
			id="pageLoadingMask"
			size="large"
			:spinning="loading"
			:class="{'page-loading':true,'top': loading,'translucent':$store.state.Setting.pageLoading.translucent}"
			:tip="loadingTxt"
		/>
		<router-view></router-view>
		<div class="update-mask" v-show="openUpdateMask"></div>
	</div>
</template>
<style lang="scss">
  @import './assets/style/base.scss';
  @import './assets/font/iconfont.css';

  #app {
    width: 100%;
    height: 100%;
    /*display: flex;
    align-items: center;
    justify-content: center;*/
    overflow: hidden;
		border-radius: 4px;
    &.web {
      background: #333;
    }
    & > div:nth-child(2) {
      position: relative;
      z-index: 2;
    }
	  .update-mask{
		  width: 100%;
		  height: 100%;
		  position: absolute;
		  top: 0;
		  left: 0;
		  z-index: 99999;
		  background: #000;
		  opacity: .3;
	  }
    .page-loading {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      position: absolute;
      left: 0;
      right: 0;
	  background:#fff!important;
	  border:none!important;
	  transition:background .1s ease!important;
      /*-webkit-app-region: drag;*/
      .ant-spin-text {
        padding-top: 10px;
      }
      &.top {
        z-index: 2000
      }
	  &.translucent{
		  background: rgba(0,0,0,.2)!important;
	  }
    }
  }
</style>
<script>
	export default {
		data() {
			return {
				openUpdateMask: false,
				isWeb: process.env.IS_WEB,
				loading: this.$store.state.Setting.pageLoading.content !== '',
				loadingTxt: this.$store.state.Setting.pageLoading.content
			}
		},
		created() {
			// 获取配置
			this.$store.dispatch('Setting/get_paramsConfig')
			if (!this.isWeb) {
				const { ipcRenderer } = require('electron')
				ipcRenderer.on('update-mask', (event, data) => {
					this.openUpdateMask = data
				})
				ipcRenderer.on('mainWinisOnline', (e, arg) => {
					this.$store.dispatch(
						'Setting/set_online', arg
					)
				})
				ipcRenderer.on('isMaxWin', (e, arg) => {
					this.$store.commit('Setting/SET_ISMAXCURRENTWIN', arg)
				})
				ipcRenderer.on('gotoLogin', async() => {
					await this.$utils.fun.logout()
					this.$store.commit('initState')
					this.$router.push({ path: '/login', replace: true, query: { resize: true }})
				})
			}
		},
		watch: {
			'$store.state.Setting.pageLoading.content'() {
				this.loading = this.$store.state.Setting.pageLoading.content !== ''
				this.loadingTxt = this.$store.state.Setting.pageLoading.content
			}
		}
	}
</script>
