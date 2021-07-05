<template>
	<div class="register-container" v-show="pageShow">
		<div class="goback_title">
			<i @click="$router.push('/login')" class="back iconfont iconfanhui"> {{$t('login.returnToLogin')}}</i>
		</div>
		<div class="setp-one">
			<h2 class="title">
				{{$t('login.createNewAccount')}}
			</h2>
			<i18n path="login.loginTip3" tag="p" class="login_server">
				<template v-slot:serviceAgreement>
					<span @click="openLicenseWin()">{{$t('common.serviceAgreement')}}</span>
				</template>
				<template v-slot:privacyTitle>
					<span @click="openLicenseWin(1)">{{$t('common.privacyTitle')}}</span>
				</template>
			</i18n>
			<a-tabs :default-active-key="0" @change="_tab" style="overflow: unset">
				<a-tab-pane :key="0" :tab="$t('common.mobileNumber')">
					<div class="form">
						<div class="form-item">
							<custom-select @selectResault="_selectResault"
								v-if="$store.state.route.fullPath.indexOf('/register') > -1 && isSelectTel"
							></custom-select>
							<input @keydown.13="_nextStep" @keydown.229="() => {}" @input="_changeAccount" ref="telAccount" v-model.trim="params.account"
								@blur.prevent="_validateAccount" style="flex: 1;" type="text"
								:placeholder="$t('common.tipMobileEnter')" maxlength="11" oninput="value=value.replace(/[^\d]/g,'')"
							>
						</div>
						<div class="form-item">
							<input @keyup.enter="_nextStep" ref="telCode" @input="_changeCode" v-model.trim="params.validateCode"
								@blur.prevent="_validateCode" maxlength="6" type="text" :placeholder="$t('common.tipCodeEnter')"
								oninput="value=value.replace(/[^\d]/g,'')"
							>
							<a-button type="primary" class="verification-code-btn" @click="_getCode()" :disabled="isDisabledGetCode" :loading="isGetting">
								<template v-if="getCodeBtnTextType == 1">
									{{$t('common.getCode')}}
								</template>
								<template v-else-if="getCodeBtnTextType == 2">
									{{$t('common.requesting')}}
								</template>
								<template v-else-if="getCodeBtnTextType == 3">
									{{$t('common.reGetCode')}}
								</template>
								<template v-else>
									{{getCodeBtnText}}
								</template>
							</a-button>
						</div>
					</div>
				</a-tab-pane>
				<a-tab-pane :key="1" :tab="$t('common.emailAddress')">
					<div class="form">
						<div class="form-item">
							<input @keydown.13="_nextStep" @keydown.229="() => {}" @input="_changeAccount" ref="emailAccount" v-model.trim="params.account"
								@blur.prevent="_validateAccount" type="text" :placeholder="$t('common.tipEmailEnter')"
								maxlength="32"
							>
						</div>
						<div class="form-item">
							<input @keydown.13="_nextStep" @keydown.229="() => {}" @input="_changeCode" ref="emailCode" v-model.trim="params.validateCode"
								@blur.prevent="_validateCode" type="text" oninput="value=value.replace(/[^\d]/g,'')"
								:placeholder="$t('common.tipCodeEnter')" maxlength="6"
							>
							<a-button type="primary" class="verification-code-btn" @click="_getCode()" :disabled="isDisabledGetCode" :loading="isGetting">
								<template v-if="getCodeBtnTextType == 1">
									{{$t('common.getCode')}}
								</template>
								<template v-else-if="getCodeBtnTextType == 2">
									{{$t('common.requesting')}}
								</template>
								<template v-else-if="getCodeBtnTextType == 3">
									{{$t('common.reGetCode')}}
								</template>
								<template v-else>
									{{getCodeBtnText}}
								</template>
							</a-button>
						</div>
					</div>
				</a-tab-pane>
			</a-tabs>
			<a-button @click="_nextStep" style="margin-top: 27px" :disabled="isDisableNext" class="next" type="primary">
				{{$t('login.regBtn')}}
			</a-button>
			<div class="reg-mode">
				<p>{{$t('login.moreSignMethods')}}</p>
				<div class="line"></div>
				<a-button @click="quickRegBtn">
					{{$t('login.quickReg')}}
				</a-button>
			</div>
		</div>
		<!--<div class="return-btn" v-if="isStepOne && $utils.os.isMac" @click="_link">
			{{$t('common.return')}}
		</div>-->
		<!-- 这边的返回有两种情况 -->
		<!-- 第一种是正常注册返回到上一步 -->
		<!-- 第二种是用户登录输入不存在的信息的时候，指引到这边来填写密码 -->
		<!-- 这时候的返回是返回到登录页面 -->
		<!--<div class="return-btn" v-else-if="$route.query.noRegister !== undefined && $utils.os.isMac" @click="_link">
			{{$t('common.return')}}
		</div>
		<div class="return-btn" v-else-if="$utils.os.isMac" @click="isStepOne = true, quickregister = false">
			{{$t('common.return')}}
		</div>-->
		<!--<i18n class="bottom_regist" path="common.clickHere" tag="p" for="login.quickReg" v-if="isStepOne" @click="isStepOne = false, quickregister = true">
			<span>{{$t('login.quickReg')}}</span>
		</i18n>
		<p class="quickreg" v-if="isStepOne" @click="isStepOne = false, quickregister = true">
			点此 <span>快速注册</span>
		</p>-->
	</div>
</template>

<script>
	import CustomSelect from '@/components/common/CustomSelect'
	import { isPhone, isCnPhone, isEmail, isPassword } from '@/utils/web'

	var timer = [] // 定义计算器全局变量

	export default {
		name: 'Register',
		components: {
			CustomSelect
		},
		data() {
			return {
				pageShow: true,
				isSelectTel: this.$route.query.isSelectTel !== undefined && this.$route.query.isSelectTel !== null ? this.$route.query.isSelectTel : true,
				isDisabledGetCode: true,
				isDisableNext: true,
				isDisableSubmit: true,
				isShowPsdIcon: false,
				params: {
					nickName: '',
					account: '',
					areaCode: '+86', // 带特殊字符需要UrlEncode,采用UTF-8编码
					password: '',
					confirmPassword: '',
					validateCode: '',
					registerType: '0' // 0: 手机注册; 1: 邮箱注册
				},
				checkParams: {
					type: '0', // 0: 手机注册; 1: 邮箱注册
					areaCode: '', // 手机区号, 需要带上'+'号
					account: '',
					validateCode: ''
				},
				getCodeBtnTextType: 1, // 1获取验证码，2请求中，3重新获取验证码, 4倒计时
				getCodeBtnText: '',
				isGetting: false,
				codeParams: {
					type: '0', // 0: 手机注册; 1: 邮箱注册
					areaCode: '',
					account: ''
				},
				quickregister: false, // 是否为快速注册
				namefocus: false, // id输入框是否聚焦
				passfocus: false, // 密码输入框是否聚焦
				namejudge: null
			}
		},
		watch: {
			'params.password'() {
				if (!this.params.password || !isPassword(this.params.password)) {
					this.isShowPsdIcon = false
					this.isDisableSubmit = true
				} else {
					this.isShowPsdIcon = true
					this.isDisableSubmit = false
				}
				// if (!this.params.password) {
				// 	this.isDisableSubmit = true
				// 	this.isShowPsdIcon = false
				// 	return
				// } else {
				// 	if (!isPassword(this.params.password)) {
				// 		this.isShowPsdIcon = false
				// 		this.isDisableSubmit = true
				// 		return
				// 	} else {
				// 		this.isShowPsdIcon = true
				// 		this.isDisableSubmit = false
				// 		// if (this.quickregister) {
				// 		// 	if (isquickAllow(this.params.nickName)) this.isDisableSubmit = false
				// 		// 	else this.isDisableSubmit = true
				// 		// } else {
				// 		// 	if (isNickNameAllow(this.params.nickName)) this.isDisableSubmit = false
				// 		// 	else this.isDisableSubmit = true
				// 		// }
				// 	}
				// }
			}
		},
		mounted() {
			const account = this.$route.query.account
			if (account !== undefined) {
				this.params.account = account
				this.params.areaCode = this.$route.query.areaCode
				this.params.validateCode = this.$route.query.validateCode
				this.isStepOne = false
			}
		},
		beforeDestroy() {
			clearInterval(timer['getCode'])
			timer = []
		},
		methods: {
			async quickRegBtn() {
				try {
					const res = await this.$utils.api.public.getParamsByName().get({ paramName: 'isECodeMust' })
					if (res.data.isECodeMust) res.data.isECodeMust = res.data.isECodeMust === '1'
					if (res.data.isECodeMust !== undefined && res.data.isECodeMust !== this.$store.state.Setting.sysConfig.isECodeMust) {
						this.$store.dispatch('Setting/set_sysConfig', {
							data: {
								isECodeMust: res.data.isECodeMust
							}
						})
					}
				} catch (e) {
					console.log(e)
				}
				this.$router.push({
					path: this.$store.state.Setting.sysConfig.isECodeMust ? '/EnterPrise' : '/register2',
					query: {
						quickregister: true
					}
				})
			},

			// 验证是否已经注册
			hasRegisted() {
				return new Promise(async(resolve, reject) => {
					const params = Object.assign({ hasPwd: false, registerType: this.checkParams.type, custError: true }, this.checkParams)
					const loginType = params.registerType == '0' ? '1' : '2'

					try {
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
							setTimeout(() => this.$router.push({ path: '/chat', replace: true, query: { resize: true }}), 50)
							resolve(true)
						} else {
							resolve(false)
						}
					} catch (e) {
						console.log(e)
						if (e.code == '601010') {
							resolve(false)
						} else if (e.code === 601023) { // 需要二次验证
							this.$store.commit('updateLoginParams', {
								fromRegist: true,
								tempParams: params,
								bindInfo: {
									areaCode: params.areaCode,
									phoneForValidate: params.type == 0 ? params.account : '',
									emailForValidate: params.type == 1 ? params.account : ''
								}
							})
							this.$router.push('/SecondVerification')
							return
						} else {
							if (e.message) {
								this.$message.error(e.message)
							}
							reject(e)
						}
					}
				})
			},

			openLicenseWin(type) {
				if (!this.onlineCheck()) return
				this.$utils.fun.createWin({ action: 'openLicenseWin', params: type })
			},
			_selectResault(value) {
				this.checkParams.areaCode = value
				this.params.areaCode = value
				if (this.params.account) {
					if (value === '+86') {
						isCnPhone(this.params.account) && !timer['getCode'] ? this.isDisabledGetCode = false : this.isDisabledGetCode = true
					} else {
						timer['getCode'] ? this.isDisabledGetCode = true : this.isDisabledGetCode = false
					}
				}
			},
			_tab(type) { // 0: 手机; 1: 邮箱
				this.isSelectTel = type === 0
				this.params.account = ''
				this.params.validateCode = ''
				clearInterval(timer['getCode'])
				timer = []
				this.getCodeBtnTextType = 1
				this.isDisabledGetCode = true
				this.isDisableNext = true
			},
			// 检测账号
			_validateAccount() {
				// 手机注册
				if (this.isSelectTel) {
					if (!this.params.account) {
						// this.$message.warning('请输入手机号码')
						// this.isDisabledGetCode = true
						this.isDisableNext = true
						return
					} else {
						if (this.params.areaCode === '+86' && !isCnPhone(this.params.account)) {
							this.$message.error(this.$t('common.tipMobileFormatError'))
							// this.isDisabledGetCode = true
							return
						} else if (!isPhone(this.params.account)) {
							this.$message.error(this.$t('common.tipMobileFormatError'))
							//  this.isDisabledGetCode = true
							return
						} else {
							// this.isDisabledGetCode = false
							if (this.params.validateCode) this.isDisableNext = false
							else this.isDisableNext = true
						}
					}
				} else {
					//  邮箱注册
					if (!this.params.account) {
						// this.$message.warning('请输入邮箱地址')
						return
					} else {
						if (!isEmail(this.params.account)) {
							this.$message.error(this.$t('common.tipEmailFormatError'))
							return
						}
					}
				}
			},
			_changeAccount(dom) {
				// 手机注册
				if (this.isSelectTel) {
					if (!this.params.account) {
						this.isDisabledGetCode = true
						this.isDisableNext = true
						return
					} else {
						if (this.params.areaCode === '+86' && !isCnPhone(this.params.account)) {
							this.isDisabledGetCode = true
							this.isDisableNext = true
							return
						}
						if (!isPhone(this.params.account) || timer['getCode'] !== undefined) {
							this.isDisabledGetCode = true
							return
						} else {
							this.isDisabledGetCode = false
							if (this.params.validateCode) this.isDisableNext = false
							else this.isDisableNext = true
						}
					}
				} else {
					//  邮箱注册
					if (!this.params.account) {
						this.isDisabledGetCode = true
						return
					} else {
						if (!isEmail(this.params.account) || timer['getCode'] !== undefined) {
							this.isDisabledGetCode = true
							this.isDisableNext = true
							return
						} else {
							this.isDisabledGetCode = false
							if (this.params.validateCode) this.isDisableNext = false
							else this.isDisableNext = true
						}
					}
				}
			},
			// 检测验证码
			_validateCode() {
				if (this.params.validateCode && this.params.account) this.isDisableNext = false
				else this.isDisableNext = true
			},
			_changeCode(dom) {
				if (this.params.validateCode && this.params.account) this.isDisableNext = false
				else this.isDisableNext = true
			},
			//    _changePsd(dom) {
			//      dom.addEventListener('input', () => {
			//        if (!this.params.password) {
			//          this.isDisableSubmit = true
			//          this.isShowPsdIcon = false
			//          return
			//        } else {
			//          if (!isPassword(this.params.password)) {
			//            this.isShowPsdIcon = false
			//            this.isDisableSubmit = true
			//            return
			//          } else {
			//            this.isShowPsdIcon = true
			//            if (isNickNameAllow(this.params.nickName)) this.isDisableSubmit = false
			//            else this.isDisableSubmit = true
			//          }
			//        }
			//      })
			//    },
			// _changeNickName(dom) {
			// 	dom.addEventListener('input', () => {
			// 		if (!this.params.nickName) {
			// 			this.isDisableSubmit = true
			// 			return
			// 		} else {
			// 			let allowname
			// 			if (this.quickregister) {
			// 				allowname = isquickAllow(this.params.nickName)
			// 			} else {
			// 				allowname = isNickNameAllow(this.params.nickName)
			// 			}
			// 			allowname ? this.namejudge = true : this.namejudge = false
			// 			//          const reg = /^[A-Za-z0-9\u4e00-\u9fa5]{1,16}$/g // 中文、数字、字母
			// 			if (allowname && isPassword(this.params.password)) this.isDisableSubmit = false
			// 			else this.isDisableSubmit = true
			// 		}
			// 	})
			// },
			async _nextStep() {
				// 手机注册
				if (this.isSelectTel) {
					if (!this.params.account) {
						// this.$message.warning('请输入手机号码')
						// this.isDisabledGetCode = true
						this.isDisableNext = true
						return
					} else {
						if (this.params.areaCode === '+86' && !isCnPhone(this.params.account)) {
							this.$message.error(this.$t('common.tipMobileFormatError'))
							// this.isDisabledGetCode = true
							return
						} else if (!isPhone(this.params.account)) {
							this.$message.error(this.$t('common.tipMobileFormatError'))
							//  this.isDisabledGetCode = true
							return
						}
						if (!this.params.validateCode) {
							this.isDisableNext = true
							return
						}
					}
				} else {
					//  邮箱注册
					if (!this.params.account) {
						// this.$message.warning('请输入邮箱地址')
						return
					} else {
						if (!isEmail(this.params.account)) {
							this.$message.error(this.$t('common.tipEmailFormatError'))
							return
						}
						if (!this.params.validateCode) {
							this.isDisableNext = true
							return
						}
					}
				}
				this.params.password = ''
				this.params.nickName = ''
				this.checkParams = {
					type: this.isSelectTel ? '0' : '1', // 0: 手机注册; 1: 邮箱注册
					areaCode: this.isSelectTel ? this.params.areaCode : '',
					account: this.params.account,
					validateCode: this.params.validateCode
				}
				this.isDisableNext = true
				try {
					await this.$utils.api.public.checkCode(this.checkParams).get()
					// 验证是否已经注册，是的话直接登录
					if (await this.hasRegisted()) {
						this.isDisableNext = false
						return
					}
					const res = await this.$utils.api.public.getParamsByName().get({ paramName: 'isECodeMust' })
					if (res.data.isECodeMust) res.data.isECodeMust = res.data.isECodeMust === '1'
					if (res.data.isECodeMust !== undefined && res.data.isECodeMust !== this.$store.state.Setting.sysConfig.isECodeMust) {
						this.$store.dispatch('Setting/set_sysConfig', {
							data: {
								isECodeMust: res.data.isECodeMust
							}
						})
					}
					this.$router.push({
						path: this.$store.state.Setting.sysConfig.isECodeMust ? '/EnterPrise' : '/register2',
						query: this.checkParams
					})
					this.isDisableNext = false
				} catch (e) {
					this.isDisableNext = false
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
			},
			_getCode() {
				this.getCodeBtnTextType = 2
				this.isGetting = true
				this.codeParams = {
					type: this.isSelectTel ? '0' : '1', // 0: 手机注册; 1: 邮箱注册
					areaCode: this.isSelectTel ? this.params.areaCode : '',
					account: this.params.account
				}
				this.$utils.fun.waiting(1000).then(() => {
					this.$utils.api.public.getCode(this.codeParams).get().then(() => {
						this.isGetting = false
						this._countDown()
					}).catch(e => {
						this.isGetting = false
						this.getCodeBtnTextType = 1
					})
				})
			},
			_countDown() {
				this.isDisabledGetCode = true
				let time = 60
				this.getCodeBtnText = '60s'
				this.getCodeBtnTextType = 4
				timer['getCode'] = setInterval(() => {
					time--
					this.getCodeBtnText = time + 's'
					if (time === 0) {
						time = 0
						clearInterval(timer['getCode'])
						timer = []
						this.getCodeBtnTextType = 3
						this.isDisabledGetCode = false
					}
				}, 1000)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.register-container {
		/deep/ .ant-tabs-bar {
			border-bottom: none;
			margin-bottom: 8px;
			.ant-tabs-tab {
				padding: 9px 0px;
				margin-right: 43px;
			}
		}
		.login_server{
			font-size: 14px;
			color: #666666;
			line-height: 150%;
			margin-bottom: 27px;
			span{
				cursor: pointer;
				color: #2e87ff
			}
		}
		.reg-mode {
			position: relative;
			margin-top: 40px;
			p{
				font-size: 12px;
				color: #999999;
				text-align: center;
				display: table;
				padding: 0 12px;
				margin: 0px auto 15px;
				background: #ffffff;
			}
			.line{
				height: 1px;
				background: #d8d8d8;
				position: absolute;
				width: 320px;
				top: 8px;
				z-index: -1;
			}
			.ant-btn{
				width: 320px;
				height: 36px;
				font-size: 14px;
				color: #666666;
			}
			/*display: flex;
			justify-content: space-between;
			align-items: center;
			height: 42px;
			margin-bottom: 22px;
			span {
				color: #999;
				font-size: 12px;
				line-height: 12px;
				cursor: pointer;
				user-select: none;
				&:hover {
					color: #2E87FF;
				}
			}*/
		}
		padding: 35px 30px 0 30px;
		.title{
			font-size: 22px;
			margin: 20px 0 3px;
		}
		.goback_title{
			cursor: pointer;
			.iconfont{
				font-size: 14px;
			}
		}
		.return-btn {
			color: #999;
			cursor: pointer;
			margin-top: 20px;
			float: left;
		}
		.tabs-wrapper {
			display: flex;
			/*justify-content: space-around;*/
			align-items: center;
			span {
				position: relative;
				font-size: 16px;
				color: #333;
				cursor: pointer;
				user-select: none;
				font-weight: 600;
				margin-right: 43px;
				&.select {
					color: #3395F9;
					&::after {
						content: '';
						position: absolute;
						top: 28px;
						left: 0;
						right: 0;
						width: 36px;
						height: 2px;
						margin: 0 auto;
						background: #3395F9;
					}
				}
			}
		}
		.form {
			// margin-top: 30px;
			/deep/ .ant-btn {
				width: 80px;
				height: 27px;
				padding: 0 5px;
				span {
					// color: #fff;
					font-size: 12px;
					line-height: 24px;
				}
			}
			.form-item {
				position: relative;
				display: flex;
				align-items: center;
				height: 42px;
				border-bottom: 1px solid #E6E6E6;
				margin-bottom: 15px;
				&:last-child{
					margin-bottom:5px;
				}
				&.special {
					display: flex;
					justify-content: space-between;
					align-items: center;
					border: 0;
					a {
						position: relative;
						color: #999999;
						font-size: 12px;
						&:hover {
							color: #2E87FF;
						}
						&.line {
							margin-right: 12px;
							&::before {
								content: '';
								position: absolute;
								top: 0;
								right: -9px;
								width: 1px;
								height: 14px;
								background: #E6E6E6;
							}
						}
					}
				}
				input::-webkit-input-placeholder {
					color: #999;
					font-size: 12px;
				}
				input {
					overflow: hidden;
					display: block;
					width: 100%;
					height: 40px;
					margin-top: 1px;
					font-size: 14px;
					border: 0;
					color: #333;
					&:focus {
						outline: none !important;
					}
				}
				i {
					position: absolute;
					top: 15px;
					right: 0;
					width: 16px;
					height: 16px;
					color: #74D773;
				}
				.eye {
					position: absolute;
					top: 37px;
					right: 8px;
					height: 40px;
					line-height: 40px;
					font-size: 16px;
					cursor: pointer;
					z-index: 10;
				}
				.blurtype{
					font-size: 12px;
					position: absolute;
					top: 50px;
					right: 28px;
				}
				.iconmacguanbi{
					color: #ff3b30;
				}
				.icongou{
					color: #27b600;
				}
			}
			.entertrue{
				border-bottom: 1px solid #47c026;
			}
			.enterfalse{
				border-bottom: 1px solid #ff3b30;
			}
			.titletrue{
				color: #27b600;
			}
			.titlefalse{
				color: #ff3b30;
			}
			.clearaword{
				font-size: 9px;
				background: #e6e6e6;
				border-radius: 50%;
				padding: 2px;
				color: #999999;
				margin: 5px 0px 0px 0px;
				cursor: pointer;
			}
			.name_title{
				border-bottom: none;
				margin-bottom: -14px;
				font-size: 14px;
				color: #333333;
				.blurtype{
					margin: 3px 0px 0px 3px;
				}
			}
		}
		.notice {
			display: block;
			font-size: 12px;
			color: #999;
			a {
				color: #2E87FF;
				&:hover {
					text-decoration: underline;
				}
			}
		}
		.next {
			display: block;
			width: 100%;
			margin-top: 28px;
		}
		.quickreg{
			position: fixed;
			bottom: -12px;
			left: 0px;
			width: 300px;
			font-size: 12px;
			line-height: 40px;
			height: 40px;
			text-align: center;
			background: #F8F8F8;
			span{
				color: #2E87FF;
				cursor: pointer;
			}
		}
		.passdesign{
			color: #999;
			font-size: 11px;
			margin: 10px 0 0 0;
			height: 40px;
		}
	}
</style>
