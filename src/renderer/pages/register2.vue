<template>
	<div class="register-container" v-show="pageShow">
		<div class="goback_title">
			<i @click="_goback" class="back iconfont iconfanhui"> {{$t('common.return')}}</i>
		</div>
		<div class="step-two">
			<div class="form" style="margin-top: 0px;">
				<h2 class="title">
					{{quickregister ? $t('login.quickReg') : $t('login.setPassword1')}}
				</h2>
				<i18n path="login.loginTip3" v-if="quickregister" tag="p" class="login_server">
					<template v-slot:serviceAgreement>
						<span @click="openLicenseWin()">{{$t('common.serviceAgreement')}}</span>
					</template>
					<template v-slot:privacyTitle>
						<span @click="openLicenseWin(1)">{{$t('common.privacyTitle')}}</span>
					</template>
				</i18n>
				<!--1.9产品要求昵称只有在提交时判断格式是否正确-->
				<!--<div class="form-item name_title" :class="{'titletrue': namejudge && params.nickName, 'titlefalse': !namejudge && params.nickName}">
					昵称 <span class="iconfont iconmacguanbi blurtype" v-if="namejudge === false && params.nickName"></span><span class="iconfont icongou blurtype" v-if="namejudge && params.nickName"></span>
				</div>-->
				<!--<div class="form-item" :class="{'entertrue': namejudge && params.nickName, 'enterfalse': !namejudge && params.nickName}">
					<input @keydown.13="_submitInfo" @keydown.229="() => {}" ref="nickName" @blur.prevent="_validateNickName"
								 v-model="params.nickName" type="text" placeholder="请设置昵称" maxlength="20" @focus="namefocus = true;passfocus = false"
					>
					<span class="iconfont iconcuo clearaword" v-if="params.nickName" @click="params.nickName = ''"></span>
				</div>-->
				<div class="form-item name_title">
					{{$t('userCard.nickname')}}
				</div>
				<div class="form-item">
					<input @keydown.13="_submitInfo" @keydown.229="() => {}" ref="nickName"
						v-model.trim="params.nickName" type="text" :placeholder="$t('login.setNickname')" maxlength="20" oninput="value=value.replace(/\s*/g,'')"
					>
					<!--2.1版本去掉清除按钮-->
					<!--<span class="iconfont iconcuo clearaword" v-if="params.nickName" @click="params.nickName = ''"></span>-->
				</div>
				<div class="form-item" style="border: 0;margin: 10px auto -10px;">
					<span style="font-size: 14px;color: #333333;" :class="{'titletrue': isShowPsdIcon && params.password, 'titlefalse': !isShowPsdIcon && params.password}">{{$t('common.password')}} <span class="iconfont iconmacguanbi blurtype" v-if="!isShowPsdIcon && params.password"></span><span class="iconfont icongou blurtype" v-if="isShowPsdIcon"></span></span>
					<span @click="_openEye" class="eye iconfont" :class="isClose ? 'iconyincang' : 'iconkejian'"></span>
				</div>
				<div class="form-item" :class="{'entertrue': isShowPsdIcon && params.password, 'enterfalse': !isShowPsdIcon && params.password}">
					<input ref="password" style="padding-right: 18px;" v-model="params.password"
						:type="pwdType" oncopy="return false" onpaste="return false" :placeholder="$t('login.setPassword')"
						maxlength="16" oncontextmenu="return false" @focus="namefocus = false;passfocus = true" @keydown.13="_submitInfo"
					>
					<!--2.1版本去掉清除按钮-->
					<!--<span class="iconfont iconcuo clearaword" v-if="params.password" @click="params.password = ''"></span>-->
					<!--1.9版去掉-->
					<!--<i v-show="isShowPsdIcon" class="iconfont icongou"></i>-->
				</div>
				<!--1.9产品要求去掉-->
				<!--<p class="passdesign" v-if="namefocus">
					{{quickregister ? 'WhatChat ID由6-20位数字、字母或符号组成，须以字母开头。' : '昵称只能为数字/字母/中文'}}
				</p>-->
				<p class="passdesign">
					{{$t('changePwd.pwdTip')}}
				</p>
			</div>
			<a-button :disabled="isDisableSubmit || !params.nickName" type="primary" @click="_submitInfo" :loading="isSubmit" class="next" style="margin-top: 25px;">
				{{quickregister ? $t('login.regBtn') : $t('common.complete')}}
			</a-button>
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
	import { isPassword, isNickNameAllow, isquickAllow } from '@/utils/web'

	export default {
		name: 'Register',
		data() {
			return {
				pageShow: true,
				isClose: false,
				isDisableSubmit: true,
				isSubmit: false,
				isShowPsdIcon: false,
				pwdType: '',
				params: {
					nickName: '',
					account: '',
					areaCode: '+86', // 带特殊字符需要UrlEncode,采用UTF-8编码
					password: '',
					confirmPassword: '',
					validateCode: '',
					registerType: '0' // 0: 手机注册; 1: 邮箱注册
				},
				quickregister: this.$route.query.quickregister || false, // 是否为快速注册
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
			this.params = {
				nickName: '',
				organId: this.$route.query.organId || '',
				account: this.$route.query.account || '',
				areaCode: this.$route.query.areaCode || '+86', // 带特殊字符需要UrlEncode,采用UTF-8编码
				password: '',
				confirmPassword: '',
				validateCode: this.$route.query.validateCode || '',
				registerType: this.$route.query.type // 0: 手机注册; 1: 邮箱注册
			}
			this.isDisableSubmit = true
		},
		methods: {
			openLicenseWin(type) {
				if (!this.onlineCheck()) return
				this.$utils.fun.createWin({ action: 'openLicenseWin', params: type })
			},
			_goback() {
				this.$router.go(-1)
				/* if (this.$store.state.Setting.sysConfig.isECodeMust) {
					this.$router.push({
						path: '/EnterPrise',
						query: this.$route.query
					})
				} else {
					this.$router.push({
						path: '/register'
					})
				}*/
			},
			_openEye() {
				if (this.pwdType === 'password') {
					this.pwdType = 'text'
					this.isClose = false
				} else {
					this.pwdType = 'password'
					this.isClose = true
				}
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
			// 检测昵称
			_validateNickName() {
				//      const reg = /^[A-Za-z0-9\u4e00-\u9fa5]{1,16}$/g // 中文、数字、字母
				//      const regPwd = /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,64}$/
				// const isNickName = isNickNameAllow(this.params.nickName)
				let isNickName
				if (this.quickregister) {
					isNickName = isquickAllow(this.params.nickName)
					isquickAllow(this.params.nickName) ? this.isDisableSubmit = false : this.isDisableSubmit = true
				} else {
					isNickName = isNickNameAllow(this.params.nickName)
				}
				const isPwdAllow = isPassword(this.params.password)
				if (!this.params.nickName) {
					// this.$message.warning('请设置昵称')
					return
				}
				if (!isNickName) {
					this.namejudge = false
					this.isDisableSubmit = true
					return
				}
				if (isNickName) {
					this.namejudge = true
					return
				}
				if (isNickName && !isPwdAllow) {
					// this.$message.error(this.$t('common.tipPwdError'))
					this.isDisableSubmit = true
					return
				}
				if (isNickName && isPwdAllow) {
					this.isDisableSubmit = false
					return
				}
			},
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
			async _submitInfo() {
				//      if (!this.params.password) {
				//        // this.$message.warning('请输入密码')
				//        return
				//      } else {
				//        const reg = /^[0-9a-zA-Z]{8,64}$/
				//        if (!reg.test(this.params.password)) {
				//          this.$message.warning('字母和数字组合,长度至少8位')
				//          return
				//        } else {
				//          if (this.params.nickName) this.isDisableSubmit = false
				//          else this.isDisableSubmit = true
				//        }
				//      }
				// if (this.quickregister) {
				// 	allowname = isquickAllow(this.params.nickName)
				// } else {
				// 	allowname = isNickNameAllow(this.params.nickName)
				// }
				if (!this.params.nickName) {
					this.$message.error(this.$t('login.setNickname'))
					return false
				}
				const allowname = isNickNameAllow(this.params.nickName)

				if (!allowname) {
					this.$message.error(this.$t('login.inputTip1[0]'))
					return false
				}
				if (isPassword(this.params.password)) {
					if (allowname) {
						this.params.confirmPassword = this.params.password
						let loginType = ''
						if (this.quickregister) {
							this.params.registerType = '2'
							this.params.account = ''
							this.params.areaCode = ''
							this.params.validateCode = ''
							loginType = '0'
						} else {
							loginType = this.params.registerType == '0' ? '1' : '2'
						}
						this.isSubmit = true
						try {
							const res = await this.$utils.api.user.register().get(this.params)
							await this.$utils.fun.userResources({ userId: res.data.userId, userInfo: res.data })
							await this.$utils.fun.setAccountInfo({
								token: res.data.token,
								organId: this.params.organId
							})
							await this.$store.dispatch('Setting/set_sysConfig', {
								data: {
									loginType: loginType,
									areaCode: this.params.areaCode,
									loginName: this.quickregister ? res.data.accountCode : this.params.account,
									lastLoginByQr: 0
								}
							})
							res.data.newUser = 1

							if (res.data.auditStatus === 0) { // 审核状态，0-待审核，1-审核通过，2-审核不通过，3-企业已解散，4-企业已禁用
								this.$router.push('/registerResult')
								return
							}

							// 开启二次验证需要判断是否绑定手机或邮箱
							if (this.params.registerType == 0) {
								res.data.userMobile = this.params.account
								res.data.areaCode = this.params.areaCode
							} else if (this.params.registerType == 0) {
								res.data.userEmail = this.params.account
							}

							await this.loginMethod(res.data)
							this.isSubmit = false
							this.pageShow = false
							setTimeout(() => this.$router.push({ path: '/chat', replace: true, query: { resize: true }}), 50)
						} catch (e) {
							this.isSubmit = false
						}
					} else {
						this.$message.error(this.$t('common.tipNameError'))
					}
				} else {
					this.$message.error(this.$t('common.tipPwdError'))
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.register-container {
		position: relative;
		height: 100%;
		.step-three{
			position: absolute;
			top: 0;
			bottom: 0;
			left: 0;
			width: 100%;
			background: #fff;
			z-index: 11;
			padding: 33px 0 0;
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
