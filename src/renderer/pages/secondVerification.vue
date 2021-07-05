<template>
	<div :class="{'register-container':true,processing:processing=='submit'}">
		<div class="goback_title">
			<i @click="_goback" class="back iconfont iconfanhui"> {{$t('common.return')}}</i>
		</div>

		<h1 class="title">
			{{$t('setting.loginProtection')}}
		</h1>

		<p class="tip" v-show="!fromRegist&&validateType==2">
			{{getCodeError_phone?$t('kickoutDevice.curPhone'):$t('kickoutDevice.sent')}} {{areaCode?`${areaCode} `:''}}{{userMobile}}
		</p>
		<p class="tip" v-show="!fromRegist&&validateType==3">
			{{getCodeError_email?$t('kickoutDevice.curEmail'):$t('kickoutDevice.sent')}} {{shortEmail}}
		</p>
		<p class="tip" v-show="fromRegist">
			{{userMobile?`${$t('kickoutDevice.curPhone')} ${areaCode} ${userMobile}`:`${$t('kickoutDevice.curEmail')} ${shortEmail}`}}
		</p>

		<div class="type-switch" v-if="!fromRegist&&userMobile&&userEmail">
			<div :class="{active:validateType==2}" @click="switchType(2)" v-if="userMobile">
				{{$t('kickoutDevice.phoneVerification')}}
			</div>

			<div :class="{active:validateType==3}" @click="switchType(3)" v-if="userEmail">
				{{$t('kickoutDevice.emailVerification')}}
			</div>
		</div>

		<div class="code-input" v-if="!fromRegist">
			<input @keyup.enter="submit" :placeholder="$t('common.tipCodeEnter')" v-model="validateCode" type="text" maxlength="6" oninput="value=value.replace(/[^\d]/g,'')">
			<a-button type="primary" :loading="processing=='getCode'" :disabled="(validateType==2&&countDown_phone>0)||(validateType==3&&countDown_email>0)" @click="getCode">
				{{btn_getCode_txt}}
			</a-button>
		</div>

		<input
			class="pwd-input"
			v-if="fromRegist"
			type="password"
			:placeholder="$t('common.enterPwd')"
			v-model.trim="pwd"
			oncopy="return false"
			onpaste="return false"
			oncontextmenu="return false"
			maxlength="16"
			oninput="value=value.replace(/\s+/g,'')"
			@keyup.enter="submit"
		>

		<a-button class="submit" type="primary" :loading="processing=='submit'" @click="submit">
			{{$t('common.okBtn')}}
		</a-button>

		<router-link v-if="fromRegist" class="forget-pwd" to="/forgetPsd?fromSecondVerification=true">
			{{$t('login.forgotPwd')}}
		</router-link>
	</div>
</template>

<script>
	export default {
		name: 'SecondVerification',
		data() {
			return {
				fromRegist: false,
				pwd: '',
				validateCode: '',
				autoLogin: false,
				loginType: 0,
				tempParams: {},
				processing: '',

				countDown_phone: 0,
				countDown_email: 0,

				countDown_phone_id: '',
				countDown_email_id: '',

				getCodeError_phone: true,
				getCodeError_email: true,

				codeSent_phone: false,
				codeSent_email: false,

				validateType: 2,

				areaCode: '',
				userMobile: '',
				userEmail: '',
				shortEmail: ''
			}
		},
		mounted() {
			const { fromRegist, bindInfo, tempParams, autoLogin, loginType } = this.$store.state.loginParams

			this.fromRegist = fromRegist
			this.tempParams = tempParams

			this.areaCode = bindInfo.areaCode || ''
			this.userMobile = bindInfo.phoneForValidate || ''
			this.userEmail = bindInfo.emailForValidate || ''
			this.shortEmail = this.$utils.format.shortEmail(this.userEmail)

			if (!fromRegist) {
				this.autoLogin = autoLogin || false
				this.loginType = loginType || 0

				if (this.loginType == 1) { // 手机验证
					this.validateType = 2
				} else if (this.loginType == 2) { // 邮箱验证
					this.validateType = 3
				}
				this.getCode()
			}
		},
		beforeDestroy() {
			if (this.countDown_phone_id || this.countDown_email_id) {
				clearInterval(this.countDown_phone_id)
				clearInterval(this.countDown_email_id)
			}
		},
		computed: {
			btn_getCode_txt() {
				if (this.processing == 'getCode') {
					return this.$t('common.requesting')
				}

				if (this.validateType == 2) {
					if (this.countDown_phone) {
						return `${this.countDown_phone}s`
					} else {
						return `${this.codeSent_phone ? this.$t('common.resend') : this.$t('common.getCode')}`
					}
				} else {
					if (this.countDown_email) {
						return `${this.countDown_email}s`
					} else {
						return `${this.codeSent_email ? this.$t('common.resend') : this.$t('common.getCode')}`
					}
				}
			}
		},
		methods: {
			switchType(type) {
				this.validateCode = ''
				this.validateType = type
			},

			_goback() {
				this.$router.go(-1)
			},

			getCode() {
				this.processing = 'getCode'
				this.$utils.api.public
					.getCode({
						type: this.validateType,
						areaCode: this.validateType == 2 ? (this.areaCode || '+86') : '',
						account: this.validateType == 2 ? this.userMobile : this.userEmail
					}).get().then((res) => {
						this.processing = ''

						let time = 59
						const curType = this.validateType
						const countDownId = setInterval(() => {
							if (curType == 2) {
								this.countDown_phone = time
							} else {
								this.countDown_email = time
							}
							time--
							if (time == -1) {
								clearInterval(countDownId)
							}
						}, 1000)

						if (curType == 2) {
							if (this.getCodeError_phone) this.getCodeError_phone = false
							if (!this.codeSent_phone) this.codeSent_phone = true
							this.countDown_phone_id = countDownId
							this.countDown_phone = 60
						} else {
							if (this.getCodeError_email) this.getCodeError_email = false
							if (!this.codeSent_email) this.codeSent_email = true
							this.countDown_email_id = countDownId
							this.countDown_email = 60
						}
					}).catch(e => {
						this.processing = ''
						if (this.validateType == 2) {
							this.getCodeError_phone = true
						} else {
							this.getCodeError_email = true
						}
					})
			},

			submit() {
				if (this.fromRegist) {
					this.regist()
				} else {
					this.login()
				}
			},

			regist() {
				return new Promise(async(resolve, reject) => {
					if (!this.pwd) {
						this.$message.error(this.$t('common.enterPwd'))
						return
					}

					const params = Object.assign(this.tempParams, { password: this.pwd })
					const loginType = params.registerType == '0' ? '1' : '2'

					try {
						this.processing = 'submit'
						const res = await this.$utils.api.user.register().get(params)
						if (res.code == 0 && res.data) {
							await this.$utils.fun.userResources({ userId: res.data.userId, userInfo: res.data })
							await this.$store.dispatch('Setting/set_sysConfig', {
								data: {
									loginType: loginType,
									areaCode: params.areaCode,
									loginName: params.account,
									lastLoginByQr: 0
								}
							})
							await this.loginMethod(res.data)
							this.processing = ''
							setTimeout(() => this.$router.push({ path: '/chat', replace: true, query: { resize: true }}), 50)
							resolve(true)
						} else {
							resolve(false)
						}
					} catch (e) {
						console.log(e)
						this.processing = ''
						if (e.code == '601010') {
							resolve(false)
						} else {
							if (e.message) {
								this.$message.error(e.message)
							}
							reject(e)
						}
					}
				})
			},

			async login() {
				const validateCode = this.validateCode
				if (!validateCode) {
					this.$message.error(this.$t('common.tipCodeEnter'))
					return
				}

				if (validateCode.length != 6) {
					this.$message.error(this.$t('common.tipCodeWrong'))
					return
				}

				try {
					this.processing = 'submit'
					const params = Object.assign({}, this.tempParams, {
						validateCode,
						secondValidateType: this.validateType == 2 ? 0 : 1
					})

					const userInfo = await this.$utils.api.user.login({
						data: params, // lastLoginByQr,扫码登录，用token自动登录
						custError: true
					}).get() // 刷新token变更在线状态

					const res_userResources = await this.$utils.fun.userResources({ userId: userInfo.data.userId, userInfo: userInfo.data })
					if (!res_userResources.isInit && userInfo.data.auditStatus > 0) {
						// 判断是否被移出企业
						await this.$utils.fun.clearLocalData(userInfo.data.organRemoveTime, userInfo.data.organId)
						this.$store.commit('updateClearLocalDataTime', userInfo.data.timestamp)
						await this.$utils.fun.userResources({ userId: userInfo.data.userId, userInfo: userInfo.data })
					}

					if (!this.autoLogin) { // 没有选择自动登录，删除回传的密码
						delete userInfo.data.p
					}
					await this.$store.dispatch('Setting/set_sysConfig', {
						data: {
							lastLoginByQr: 0,
							autoLogin: this.autoLogin,
							lastLogin: userInfo.data.accountCode,
							lastUserId: userInfo.data.userId,
							loginType: this.loginType,
							loginName: params.account,
							areaCode: params.areaCode || '',
							loginQrcodeTime: '',
							loginQrcode: '',
							organId: userInfo.data.organId
						}
					})

					if (userInfo.data.auditStatus === 0) {
						this.$router.push('/registerResult')
						return
					}

					await this.loginMethod(userInfo.data)
					await this.$utils.api.user.directEnterOrQuit({ type: '0' }).get() // 通知APP
					this.processing = ''
					setTimeout(() => this.$router.push({ path: '/chat', replace: true, query: { resize: true }}), 50)
				} catch (e) {
					console.log(e)
					this.processing = ''
					if (e.code == 604) {
						this.$utils.fun.openUpdateWin(e)
						return
					}
					this.$message.error(e.message)
					await this.$utils.fun.clearUserInfo()
					this.$store.commit('initState')
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

<style lang="scss" scoped>
	.register-container {
		position: relative;
		height: 100%;
		box-sizing: border-box;
		padding: 30px 30px 0;
		&.processing{
			pointer-events: none;
		}

		.goback_title{
			cursor: pointer;
			.iconfont{
				font-size: 14px;
			}
		}

		.title{
			font-size: 22px;
			margin: 20px 0 3px;
			margin-top: 58px;
		}

		.tip{
			font-size: 14px;
			color:#666;
			margin:8px 0 34px;
		}

		.type-switch{
			display: flex;
			align-items: center;
			margin-bottom: 20px;
			div{
				cursor: pointer;
				font-size: 14px;
				color:#666;
				margin-right: 42px;
				&.active{
					color: #1991ff;
					border-bottom: 2px solid #1991ff;
				}
			}
		}

		.code-input{
			display: flex;
			align-items: center;
			border-bottom:1px solid #e6e6e6;
			height: 40px;
			margin-bottom: 25px;
			justify-content: space-between;

			input{
				height: 100%;
				width:230px;
			}

			button{
				padding: 0!important;
				width:80px;
				height: 30px!important;
				box-sizing: border-box;
				font-size: 12px;
			}
		}

		.pwd-input{
			margin-bottom: 25px;
			height: 40px;
			width:100%;
		}

		.submit{
			width:100%;
			border-radius: 4px;
			height: 36px;
		}

		.forget-pwd{
			color: #999999;
			font-size: 12px;
			margin-top: 10px;
			float: right;
			&:hover{
				color:#1890ff;			}
		}

	}
</style>
