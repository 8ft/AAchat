<template>
	<div class="register-container">
		<a-modal
			class="notification-IM"
			centered
			:width="436"
			:maskClosable="false"
			:title="$t('common.switchAccount')"
			:visible="exitLoginModal"
			@cancel="exitLoginModal = false"
		>
			<p>{{$t('common.switchConfirm')}}</p>
			<template #footer>
				<a-button type="primary" @click="_logout">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button @click="exitLoginModal = false">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>
		<div class="banner">
			<img src="@/assets/img/img222.png">
		</div>
		<div class="status-text">
			<template v-if="auditData.auditStatus === 0 || auditData.auditStatus === 1">
				<i class="iconfont iconfasongshibai"></i>
				{{$t('common.review')}}
			</template>
			<template v-else-if="auditData.auditStatus === 2">
				<i class="iconfont iconguanbi1"></i>
				{{$t('common.declined')}}
			</template>
			<template v-else-if="auditData.auditStatus === 3 || auditData.auditStatus === 4">
				<i class="iconfont iconguanbi1"></i>
				{{$t('common.failed')}}
			</template>
		</div>
		<div class="text" v-if="auditData.organName">
			<template v-if="auditData.auditStatus === 0 || auditData.auditStatus === 1">
				{{$t('login.registerReviewText[0]', { organName: auditData.organName })}}
			</template>
			<template v-else-if="auditData.auditStatus === 2">
				{{$t('login.registerReviewText[1]', { organName: auditData.organName })}}
			</template>
			<template v-else-if="auditData.auditStatus === 3 || auditData.auditStatus === 4">
				{{$t('login.registerReviewText[3]', { organName: auditData.organName })}}
			</template>
		</div>
		<div class="btns">
			<a-button type="primary" style="width: 100%; margin-bottom: 10px;" @click="_organInvite">
				{{$t('organization.join_create')}}
			</a-button>
			<span @click="exitLoginModal = true">
				{{$t('common.switchAccount')}}
			</span>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'RegisterResult',
		data() {
			return {
				exitLoginModal: false,
				auditData: {
					organName: '',
					auditStatus: 0 // 审核状态 0-未审核 1-审核通过可登录 2-审核拒绝
				},
				loopAuditStatusInterval: null
			}
		},
		beforeDestroy() {
			if (this.loopAuditStatusInterval) {
				clearInterval(this.loopAuditStatusInterval)
				this.loopAuditStatusInterval = null
			}
		},
		mounted() {
			this.init()
		},
		watch: {
			'$store.state.organizationPage'(val) {
				if (val === '') {
					setTimeout(() => {
						this.init()
					}, 100)
				}
			}
		},
		methods: {
			async init() {
				try {
					await this.loopAuditStatus()
					let res
					// 审核状态，0-待审核，1-审核通过，2-审核不通过，3-企业已解散，4-企业已禁用
					if (this.auditData.auditStatus === 1) {
						res = await this.$utils.api.user.joinOrgan({ organId: this.auditData.organId, switchType: 1 }).get()
					} else {
						return
					}
					console.log(3333, res.data)
					await this.$utils.fun.setAccountInfo({
						token: res.data.token,
						organId: res.data.organId
					})
					await this.loginMethod(res.data)
					setTimeout(() => this.$router.push({ path: '/chat', replace: true, query: { resize: true }}), 50)
				} catch (e) {
				}
			},
			_organInvite() {
				if (this.loopAuditStatusInterval) {
					clearInterval(this.loopAuditStatusInterval)
					this.loopAuditStatusInterval = null
				}
				this.$store.commit('setOrganizationPage', 'index')
			},
			_logout() {
				this.$store.dispatch('Setting/set_pageLoading', this.$t('common.switchAccount') + '...')
				if (this.loopAuditStatusInterval) {
					clearInterval(this.loopAuditStatusInterval)
				}
				this.exitLoginModal = false
				this.$utils.api.user
					.logout()
					.get()
					.then(async res => {
						this.$store.dispatch('Setting/set_autoLogin', false)
						this.$store.dispatch('Setting/set_pageLoading', '')
						await this.$utils.fun.logout()
						this.$store.commit('initState')
						setTimeout(() => this.$router.push({ path: '/login', replace: true, query: { resize: true }}), 50)
					})
					.catch(e => {
						this.$store.dispatch('Setting/set_pageLoading', '')
						if (e.code == 899999) { this.$utils.fun.exitChat({ sendNotice: false }) }
					})
			},
			async loopAuditStatus() {
				try {
					if (this.loopAuditStatusInterval) {
						clearInterval(this.loopAuditStatusInterval)
						this.loopAuditStatusInterval = null
					}
					const res = await this.$utils.api.user.loopAuditStatus().get()
					this.auditData = res.data
					console.log('loopAuditStatus:::', res.data)
					// auditStatus 审核状态 0-未审核 1-审核通过可登录 2-审核拒绝
					if (res.data.auditStatus === 0) {
						await this.$utils.fun.waiting(5000, (interval) => {
							this.loopAuditStatusInterval = interval
						})
						return this.loopAuditStatus()
					} else {
						return Promise.resolve()
					}
				} catch (e) {
					await this.$utils.fun.waiting(5000, (interval) => {
						this.loopAuditStatusInterval = interval
					})
					return this.loopAuditStatus()
				}
			},

			loginMethod(userInfo) {
				return new Promise(async(resolve, reject) => {
					try {
						let newUserInfo = {}
						if (userInfo.token) {
							newUserInfo = await this.$utils.api.user.getUserInfo().get()
							newUserInfo = Object.assign({}, userInfo, newUserInfo.data)
						} else {
							newUserInfo = await this.$utils.fun.getAccountInfo()
							newUserInfo = Object.assign({}, newUserInfo, userInfo)
						}
						await this.$utils.fun.setAccountInfo(newUserInfo) // 此处没用store的user/set_accountinfo方法，是为了不写token到store，/chat页面判断有没有token取数据
						await this.$utils.chatSdk.initChat()
						resolve()
					} catch (e) {
						reject(e)
					}
				})
			}
		}
	}
</script>

<style scoped lang="scss">
.register-container{
	padding: 33px 0 0;
	height: 100%;
	position: relative;
	.btns{
		position: absolute;
		bottom: 40px;
		left: 0;
		width: 100%;
		padding: 0 30px 0;
		display: flex;
		align-items: center;
		flex-direction: column;
		span {
			cursor: pointer;
			color: #999;
		}
	}
	.banner{
		text-align: center;
	}
	.status-text{
		.iconfont{
			color: #ff8f1f;
			font-size: 24px;
			margin-right: 5px;
		}
		margin-top: 17px;
		color: #333;
		font-size: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.text{
		color: #999;
		font-size: 14px;
		width: 270px;
		margin: 10px auto;
		text-align:center;
		line-height: 150%;
	}
}
</style>
