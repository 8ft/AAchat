<template>
	<div class="about">
		<div class="noupdate">
			<div class="updatabanner">
				<img src="@/assets/img/beijing.png" alt="" class="bannimg">
				<div class="about-content">
					<div class="logo"></div>
					<p>{{$PROJECT_NAME}}</p>
					<p>{{$t('common.version')}}: {{$WEB_CONFIG.VERSION}}.{{$WEB_CONFIG.REVISION}}{{ENV_CONFIG}}</p>
				</div>
			</div>
			<a-button type="primary" @click="isneedupdata" :loading="loadings" v-if="!isupdata && !ishaveupdata">
				{{$t('about.versionCheck')}}
			</a-button>
			<a-button type="primary" v-if="isupdata && !ishaveupdata" disabled>
				{{$t('about.latestVersion')}}
			</a-button>
			<a-button type="primary" v-if="ishaveupdata" disabled>
				{{$t('about.newVerFound')}}
			</a-button>
			<p class="checkup">
				Copyright ©2019 {{$PROJECT_NAME}}
			</p>
			<p class="checkup1" @click="openLicenseWin">
				{{$t('common.serviceAgreement')}}
			</p>
		</div>
		<!--<div class="haveupdata" v-if="ishaveupdata">
			<h1 class="title1">
				发现新版本
			</h1>
			<p>更新说明：</p>
			<div class="updatacontent" v-html="updatainfo.data.description">
			</div>
			<a-button type="primary" @click="update" class="updata">
				{{$t('common.update')}}
			</a-button>
			<p class="verson">
				{{$t('common.version')}}: {{updatainfo.data.version}}
			</p>
		</div>-->
	</div>
</template>
<script>
	import { ipcRenderer } from 'electron'
	import { setLang } from '@/assets/lang'
	export default {
		data() {
			return {
				loadings: false, // 按钮加载
				ishaveupdata: false, // 是否显示版本更新
				isupdata: false, // 是否已是最新版本
				updatainfo: {}, // 新版本信息
				ENV_CONFIG: this.$WEB_CONFIG.ENV_CONFIG !== undefined ? (this.$WEB_CONFIG.ENV_CONFIG !== 'prod' ? '.' + this.$WEB_CONFIG.ENV_CONFIG : '') : '.dev'
			}
		},
		created() {
			ipcRenderer.on('changeLang', (event, lang) => {
				setLang(lang)
				// this.handleClose()
			})
		},
		beforeDestroy() {
		},
		methods: {
			openLicenseWin() {
				//        this.$utils.fun.createWin({ action: 'openLicenseWin' })
				if (!this.onlineCheck()) return
				this.$utils.fun.createWin({ action: 'openLicenseWin' })
			},
			update() {
				ipcRenderer.send('updateApp', this.updatainfo)
			},
			isneedupdata() {
				this.loadings = true
				this.$utils.api.public.checkVersion({ version: this.$WEB_CONFIG.VERSION }).get().then(res => {
					this.loadings = false
					if (res.data.upgrade == 0) {
						this.isupdata = true
					} else {
						// this.ishaveupdata = true
						this.$utils.fun.openUpdateWin(res)
						/* this.ishaveupdata = true
						this.updatainfo = res
						this.updatainfo.data.description = this.updatainfo.data.description.replace(/\n/g, '<br>')*/
					}
				}).catch(e => {
					this.loadings = false
				})
			}
		}
	}
</script>
<style lang="scss">
  .about {
    padding: 0px;
    margin: 0px;
    width: 100%;
    overflow: hidden;
    text-align: center;
    padding-top: 20px;
    .logo {
      display: block;
      width: 64px;
      height: 64px;
      margin: auto;
      @include retinize('logo');
    }
    .noupdate {
      width: 100%;
      overflow: hidden;
      p {
        font-size: 12px;
      }
      .updatabanner {
        clear: both;
        width: 100%;
        position: relative;
        margin-bottom: 24px;
        /*background-image: url("~@/assets/img/beijing.png") no-repeat center center;*/
        .bannimg {
          width: 100%;
          height: 148px;
          position: absolute;
          top: 0;
          left: 0;
        }
        .about-content {
          position: relative;
          z-index: 2;
          margin: 15px auto 0;
          text-align: center;
          img {
            height: 64px;
            width: 64px;
          }
          p {
            margin: 0px;
            &:nth-of-type(1) {
              font-size: 34px;
              font-weight: bold;
            }
          }
        }
      }
      .checkup {
        color: #000000;
        margin: 28px 0px 12px 0px;
      }
      .checkup1 {
        cursor: pointer;
        color: #3395F9;
        margin: 0px;
      }
    }
    .haveupdata {
      width: 340px;
      margin: 0px auto;
      overflow: hidden;
      .title1 {
        font-size: 20px;
      }
      .updatacontent {
        margin-top: 5px;
        height: 150px;
        overflow-x: hidden;
        overflow-y: auto;
        line-height: 180%;
        text-align: left;
      }
      p {
        font-size: 14px;
        text-align: left;
        padding: 0;
        margin: 0;
      }
      .updata {
        width: 88px;
        height: 34px;
        margin-top: 15px;
      }
      .verson {
        font-size: 12px;
        text-align: center;
        margin: 15px 0px 5px 0px;
      }
    }
  }
</style>
