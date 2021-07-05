<template>
	<div class="login-reg-wrapper">
		<div class="header" v-if="$utils.os.isWindows">
			<span class="title">
				<!-- <i class=""></i> -->
				<!--<span>{{$PROJECT_NAME}}</span>-->
			</span>
			<div class="btn-wrapper">
				<i @click="$utils.currentWindow.min" class="small iconfont iconjian"></i>
				<i @click="$utils.currentWindow.hide" class="close iconfont icontongyongguanbi"></i>
			</div>
		</div>
		<div class="header mac" v-else>
			<i class="iconfont iconguanbi" @click="$utils.currentWindow.hide"></i>
		</div>
		<!-- 登录遮罩 -->
		<div v-show="$store.state.Setting.loginLoading" class="login-cover">
			<div><img :src="logoAnimation"></div>
			<span>{{$t('common.logining')}}<b>{{loadingTxt}}</b></span>
		</div>
		<div :class="{'login-body':true,'hide-overflow':this.$store.state.organizationPage}">
			<Organization parent="login" @switchOrgan="switchOrgan" @createdOrgan="reloadPage"></Organization>

			<div class="leftcarous">
				<LoginCarousel></LoginCarousel>
			</div>
			<div class="main" :class="{'macstyle': $utils.os.isMac}">
				<router-view></router-view>
			</div>
		</div>
	</div>
</template>

<script>
	import LoginCarousel from '@/components/LoginCarousel'
	import Organization from '@/components/Organization/index.vue'
	const logoAnimation = require('@/assets/img/' + process.env.PROJECT_NAME + '/logo-animation.gif')

	export default {
		name: 'Login',
		data() {
			return {
				loadingTxt: '',
				timer1: '',
				logoAnimation
			}
		},
		components: {
			LoginCarousel,
			Organization
		},
		mounted() {
			this.timer1 = setInterval(() => {
				if (this.loadingTxt === '...') {
					this.loadingTxt = ''
				} else {
					this.loadingTxt += '.'
				}
			}, 500)
			this.$store.dispatch(
				'Setting/set_online', true
			)
		},
		beforeDestroy() {
			clearInterval(this.timer1)
		},
		methods: {
			async switchOrgan(switchingOrgan) {
				this.$store.dispatch('Setting/set_pageLoading', this.$t('common.loading') + '...')
				const organId = `${switchingOrgan.organId}`
				let switchType = 1
				if (!switchingOrgan.exits) {
					switchType = 0
				}
				try {
					const res = await this.$utils.api.user.joinOrgan({ organId, switchType, custError: true }).get()
					if (res.code == 0) {
						console.log('即将切换到的账号信息', res)
						await this.$utils.fun.setAccountInfo({
							organId
						})
						this.reloadPage(res.data, true)
					} else {
						this.$store.commit('setOrganizationPage', '')
						setTimeout(() => {
							this.$store.dispatch('Setting/set_pageLoading', '')
						}, 300)
					}
				} catch (e) {
					console.log('切换企业异常：', e)
					if (e.code && (e.code == 601017 || e.code == 601019)) { // 审核中
						await this.$utils.fun.setAccountInfo({
							organId
						})

						if (e.code == 601019) {
							this.$store.dispatch('Setting/set_pageLoading', '')
							const that = this
							this.$info({
								title: this.$t('organization.error[1]'),
								centered: true,
								okText: this.$t('common.gotIt'),
								async onOk() {
									that.$store.commit('setOrganizationPage', '')
								}
							})
						} else {
							this.$store.commit('setOrganizationPage', '')
							setTimeout(() => {
								this.$store.dispatch('Setting/set_pageLoading', '')
							}, 300)
						}
					} else if (e.code == 601020) { // 账号被禁用
						this.$store.dispatch('Setting/set_pageLoading', '')
						const that = this
						this.$info({
							title: this.$t('common.aboutAccountTip[0]'),
							centered: true,
							okText: this.$t('common.gotIt'),
							async onOk() {
								await that.$utils.fun.logout()
								that.$store.commit('initState')
								that.$router.replace('/login')
								that.$store.commit('setOrganizationPage', '')
							}
						})
					} else {
						if (e.meesage) this.$message.error(e.message)
						this.$store.commit('setOrganizationPage', '')
						setTimeout(() => {
							this.$store.dispatch('Setting/set_pageLoading', '')
						}, 300)
					}
				}
			},

			async reloadPage(accountInfo, isJoin) {
				try {
					await this.$utils.fun.setAccountInfo({
						token: accountInfo.token
					})

					// 设置用户文件路径等
					await this.$utils.fun.userResources({ userId: accountInfo.userId, userInfo: accountInfo })
					// 更新当前企业信息
					this.$store.dispatch('Setting/set_organInfo', {
						organName: accountInfo.organName,
						organCode: accountInfo.organCode,
						organId: accountInfo.organId
					})

					// 更新用户信息
					let newUserInfo = await this.$utils.api.user.getUserInfo().get()
					newUserInfo = Object.assign({}, accountInfo, newUserInfo.data)

					await this.$store.dispatch('Setting/set_sysConfig', {
						data: {
							lastLogin: newUserInfo.accountCode,
							lastUserId: newUserInfo.userId,
							organId: newUserInfo.organId,
							organName: newUserInfo.organName,
							organCode: newUserInfo.organCode
						}
					})

					await this.$utils.fun.setAccountInfo(newUserInfo) // 此处没用store的user/set_accountinfo方法，是为了不写token到store，/chat页面判断有没有token取数据
					await this.$utils.chatSdk.initChat()

					await this.$utils.api.user.directEnterOrQuit({ type: '0' }).get() // 通知APP
					setTimeout(() => {
						this.$store.dispatch('Setting/set_pageLoading', '')
						this.$router.push({ path: '/chat', replace: true, query: { resize: true, organizationPage: isJoin ? '' : 'preInvite' }})
					}, 50)
				} catch (e) {
					console.log(e)
					if (this.switchOrgan == 'error') return
					this.switchOrgan = 'error'
					console.log('切换企业异常,准备前往登录界面：', e)
					await this.$utils.fun.logout()
					this.$store.commit('initState')
					this.$router.replace('/login')
					this.$store.dispatch('Setting/set_pageLoading', '')
					return
				}
			}
		}
	}
</script>
<style lang="scss" scoped>
	.login-reg-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		margin: 0 auto;
		background: #fff;
		user-select: none;
		-webkit-app-region: drag;
		display: flex;
		flex-direction: column;

		.login-cover {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: #fff;
			z-index: 11;
			overflow: auto;
			div {
				margin-top: 236px;
				padding-left: 5px;
				text-align: center;
			}
			span {
				display: table;
				margin: 10px auto 0;
				font-size: 14px;
				color: #999;
				position: relative;
				b {
					position: absolute;
					left: 100%;
					bottom: 1px;
					font-weight: normal;
				}
			}
		}
		.header {
			z-index: 12;
			display: flex;
			justify-content: space-between;
			align-items: center;
			height: 50px;
			padding: 0 20px;
			/*border-bottom: 1px solid #E6E6E6;*/
			-webkit-app-region: drag;
			position: relative;
			&.mac {
				border: 0;
				height: auto;
				padding: 15px 15px 0;
				margin-bottom: 21px;
				& > i {
					display: flex;
					overflow: hidden;
					align-items: center;
					justify-content: center;
					width: 14px;
					height: 14px;
					background: #FA665F;
					border-radius: 50%;
					font-size: 17px;
					padding-left: 1px;
					font-weight: bold;
					&:hover {
						color: #333;
					}
					cursor: default;
				}
			}
			.title {
				font-size: 14px;
				color: #333;
				-webkit-app-region: no-drag;
			}
			.btn-wrapper {
				-webkit-app-region: no-drag;
				& > i {
					font-size: 19px !important;
					color: #999;
					cursor: pointer;
					user-select: none;
					&:hover {
						color: #2E87FF;
					}
					&.small {
						margin-right: 6px;
					}
				}
			}
		}

		.login-body{
			position: relative;
			flex: 1;

			&.hide-overflow{
				overflow: hidden;
			}

		.main{
			width: 384px;
			height: 509px;
			float: right;
			box-shadow: 0px 0px 30px #E5E5E5!important;
			margin-right: 118px;
			border-radius: 4px;
			overflow: hidden;
			/deep/ .ant-btn{
				height: 36px;
			}
		}
		.leftcarous{
			width: 400px;
			height: 509px;
			float: left;
			margin-left: 98px;
		}
		}
	}
</style>
