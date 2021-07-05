<template>
	<div class="forget-pws-wrapper">
		<div class="goback_title">
			<i v-if="isStepOne" @click="_link" class="back iconfont iconfanhui"> {{isFromSecondVerification?$t('common.return'):$t('login.returnToLogin')}}</i>
			<i v-else @click="gotofirst" class="back iconfont iconfanhui"> {{$t('common.return')}}</i>
		</div>
		<h2 v-if="isStepOne">
			{{$t('login.forgotPwd')}}
		</h2>
		<!-- 第一步 -->
		<div v-show="isStepOne" class="setp-one">
			<a-tabs :default-active-key="0" @change="_tab" style="overflow: unset">
				<a-tab-pane :key="0" :tab="$t('login.retrByMobile')">
					<div class="form">
						<div class="form-item">
							<custom-select @selectResault="_selectResault"></custom-select>
							<input @keydown.13="_nextStep" @keydown.229="() => {}" @input="_changeAccount" ref="accountTel" @blur.prevent="_validateAccount"
								v-model.trim="params.account"
								style="flex: 1;" type="text" :placeholder="$t('common.tipMobileEnter')" maxlength="11"
								oninput="value=value.replace(/[^\d]/g,'')"
							>
						</div>
						<div class="form-item">
							<input @keydown.13="_nextStep" @keydown.229="() => {}" @input="_changeCode" maxlength="6" ref="telCode"
								v-model.trim="params.validateCode" @blur.prevent="_validateCode" type="text"
								:placeholder="$t('common.tipCodeEnter')" oninput="value=value.replace(/[^\d]/g,'')"
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
				<a-tab-pane :key="1" :tab="$t('login.retrByEmail')">
					<div class="form">
						<div class="form-item">
							<input @keydown.13="_nextStep" @keydown.229="() => {}" @input="_changeAccount" ref="accountEmail" @blur.prevent="_validateAccount"
								v-model.trim="params.account" type="text" :placeholder="$t('common.tipEmailEnter')" maxlength="32"
							>
						</div>
						<div class="form-item">
							<input @keydown.13="_nextStep" @keydown.229="() => {}" @input="_changeCode" maxlength="6" ref="emailCode"
								v-model.trim="params.validateCode" @blur.prevent="_validateCode" type="text"
								:placeholder="$t('common.tipCodeEnter')"
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
			<a-button @click="_nextStep" :disabled="isDisableNext" class="next" type="primary">
				{{$t('common.next')}}
			</a-button>
		</div>
		<!-- 第二步 -->
		<div v-show="!isStepOne" class="step-two">
			<h2>{{$t('changePwd.resetPwd')}}</h2>
			<div class="form">
				<div class="form-item" :class="{'enterTrue': !isDisableSubmit}">
					<input @keydown.13="_submit" @keydown.229="() => {}" ref="pwd"
						v-model="params.newPassword" @blur.prevent="_validatePsd" oncopy="return false"
						onpaste="return false" oncontextmenu="return false"
						:type="pwdType" :placeholder="$t('common.enterPwd')" maxlength="16"
					>
					<span v-show="!isDisableSubmit" class="iconfont icongou"></span>
					<span @click="_openEye" class="eye iconfont" :class="isClose ? 'iconyincang' : 'iconkejian'"></span>
				</div>
				<p style="color: #999;font-size: 11px; margin: 10px 0px 0px;">
					{{$t('changePwd.pwdTip')}}
				</p>
			</div>
			<a-button :disabled="isDisableSubmit" type="primary" @click="_submit" :loading="isSubmit" class="next">
				{{$t('common.complete')}}
			</a-button>
		</div>
		<!--<div v-if="isStepOne && $utils.os.isMac" @click="_link" class="return-btn">
			{{$t('common.return')}}
		</div>
		<div v-else-if="$utils.os.isMac" @click="isStepOne = true" class="return-btn">
			{{$t('common.return')}}
		</div>-->
		<i18n class="bottom_regist" path="login.noAccountTip" tag="p" for="login.registerNow">
			<span @click="$router.push('/EnterPrise?type=reg')">{{$t('login.registerNow')}}</span>
		</i18n>
	</div>
</template>

<script>
	import CustomSelect from '@/components/common/CustomSelect'
	import { isPhone, isEmail, isCnPhone, isPassword } from '@/utils/web'

	const timer = [] // 定义计算器全局变量

	export default {
		name: 'ForgetPsd',
		components: {
			CustomSelect
		},
		data() {
			return {
				isSelectTel: true,
				isStepOne: true, // 判断是否第一步
				isClose: false,
				isGetting: false,
				isSubmit: false,
				isDisabledGetCode: true,
				isDisableNext: true,
				isDisableSubmit: true,
				isShowPsdIcon: false,
				pwdType: '',
				params: {
					account: '',
					areaCode: '+86',
					newPassword: '',
					validateCode: ''
				},
				getCodeBtnTextType: 1, // 1获取验证码，2请求中，3重新获取验证码, 4倒计时
				getCodeBtnText: '',
				codeParams: {
					type: '4', // 4: 手机找回; 5: 邮箱找回
					areaCode: '',
					account: ''
				}
			}
		},
		watch: {
			'params.newPassword'() {
				if (!this.params.newPassword) {
					this.isDisableSubmit = true
					this.isShowPsdIcon = false
					return
				} else {
					if (!isPassword(this.params.newPassword)) {
						this.isDisableSubmit = true
						this.isShowPsdIcon = false
						return
					} else {
						this.isDisableSubmit = false
						this.isShowPsdIcon = true
					}
				}
			}
		},
		computed: {
			isFromSecondVerification() {
				return this.$route.query.fromSecondVerification
			}
		},
		methods: {
			gotofirst() {
				this.isStepOne = true
				if (timer['getCode']) this.isDisabledGetCode = true
			},
			_link() {
				if (this.isFromSecondVerification) {
					this.$router.go(-1)
				} else {
					this.$router.push({
						path: '/login'
					})
					this._initPage()
				}
			},
			_selectResault(value) {
				this.codeParams.areaCode = value
				this.params.areaCode = value
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
			_tab(type) { // 0: 手机; 1: 邮箱
				if (type === 0) {
					this.isSelectTel = true
					this.params.areaCode = '+86'
				} else {
					this.isSelectTel = false
					this.params.areaCode = ''
				}
				this.params.account = ''
				this.params.validateCode = ''
				clearInterval(timer['getCode'])
				this.getCodeBtnTextType = 1
				this.isDisabledGetCode = true
				this.isDisableNext = true
			},
			// 检测账号
			_validateAccount() {
				// 手机注册
				if (this.isSelectTel) {
					if (!this.params.account) {
						// this.$message.error('请输入手机号码')
						this.isDisabledGetCode = true
						this.isDisableNext = true
						return
					} else {
						//          if (!isPhone(this.params.account)) {
						//            this.$message.error(this.$t('common.tipMobileFormatError'))
						//            return
						//          } else {
						//            this.isDisabledGetCode = false
						//            if (this.params.validateCode) this.isDisableNext = false
						//            else this.isDisableNext = true
						//          }
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
						// this.$message.error('请输入邮箱地址')
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
						} else if (!isPhone(this.params.account)) {
							this.isDisabledGetCode = true
							this.isDisableNext = true
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
						if (!isEmail(this.params.account)) {
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
			// 检测密码
			_validatePsd() {
				if (!this.params.newPassword) {
					// this.$message.error('请输入密码')
					return
				} else {
					if (!isPassword(this.params.newPassword)) {
						const _this = this
						setTimeout(function() {
							_this.$message.error(_this.$t('common.tipPwdError'))
						}, 200)
						return
					} else this.isDisableSubmit = false
				}
			},
			//    _changePwd(dom) {
			//      dom.addEventListener('input', () => {
			//        if (!this.params.newPassword) {
			//          this.isDisableSubmit = true
			//          this.isShowPsdIcon = false
			//          return
			//        } else {
			//          if (!isPassword(this.params.newPassword)) {
			//            this.isDisableSubmit = true
			//            this.isShowPsdIcon = false
			//            return
			//          } else {
			//            this.isDisableSubmit = false
			//            this.isShowPsdIcon = true
			//          }
			//        }
			//      })
			//    },
			_nextStep() {
				// 手机找回
				if (this.isSelectTel) {
					if (!this.params.account) {
						// this.$message.error('请输入手机号码')
						this.isDisabledGetCode = true
						this.isDisableNext = true
						return
					} else {
						if (!isPhone(this.params.account)) {
							this.$message.error(this.$t('common.tipMobileFormatError'))
							return
						} else {
							this.isDisabledGetCode = false
							if (this.params.validateCode) this.isDisableNext = false
							else this.isDisableNext = true
						}
					}
				} else {
					//  邮箱找回
					if (!this.params.account) {
						// this.$message.error('请输入邮箱地址')
						return
					} else {
						if (!isEmail(this.params.account)) {
							this.$message.error(this.$t('common.tipEmailFormatError'))
							return
						}
					}
				}
				this.params.newPassword = ''
				this.checkParams = {
					type: this.isSelectTel ? '4' : '5', // 4: 手机找回; 5: 邮箱找回
					areaCode: this.isSelectTel ? this.params.areaCode : '',
					account: this.params.account,
					validateCode: this.params.validateCode
				}
				this.$utils.api.public.checkCode(this.checkParams).get().then(res => {
					this.isStepOne = false
				})
			},
			_submit() {
				if (!this.params.newPassword) {
					// this.$message.error('请输入密码')
					return
				} else {
					if (!isPassword(this.params.newPassword)) {
						this.$message.error(this.$t('common.tipPwdError'))
						return
					} else this.isDisableSubmit = false
				}
				this.isSubmit = true
				this.$utils.api.user.forgetPwd(this.params).get().then(res => {
					this.$message.success(this.$t('changePwd.tip[0]'))

					if (this.isFromSecondVerification) {
						this.$router.go(-1)
					} else {
						this.$router.push('/login')
						this.isSubmit = false
						this._initPage()
					}
				}).catch((e) => {
					this.isSubmit = false
				})
			},
			_getCode() {
				this.getCodeBtnTextType = 2
				this.isGetting = true
				this.codeParams = {
					type: this.isSelectTel ? '4' : '5', // 4: 手机找回; 5: 邮箱找回
					areaCode: this.isSelectTel ? this.params.areaCode : '',
					account: this.params.account
				}
				this.$utils.fun.waiting(1000).then(() => {
					this.$utils.api.public.getCode(this.codeParams).get().then(() => {
						this.isGetting = false
						setTimeout(() => {
							this.isSubmit = false
						}, 800) // 加个定时器是为了登录loading平滑显示，不然不显示出来
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
						this.getCodeBtnTextType = 3
						this.isDisabledGetCode = false
					}
				}, 1000)
			},
			_initPage() {
				// 应为router-view外面添加了keep-alive,所以页面的所有状态都必须重置
				this.params = {
					account: '',
					areaCode: '+86',
					newPassword: '',
					validateCode: ''
				}
				this.isStepOne = true
				this.isSelectTel = true
				this.isClose = false
				this.isGetting = false
				this.isSubmit = false
				this.isDisabledGetCode = true
				this.isDisableNext = true
				this.isDisableSubmit = true
				this.pwdType = ''
				clearInterval(timer['getCode'])
				this.getCodeBtnTextType = 1
			}
		}
	}
</script>

<style lang="scss" scoped>
  .forget-pws-wrapper {
	  padding: 27px 30px 0 30px;
	  /deep/ .ant-tabs-bar {
		  border-bottom: none;
		  margin-bottom: 8px;
		  .ant-tabs-tab {
			  padding: 9px 0px;
			  margin-right: 43px;
		  }
	  }
	  .return-btn {
      color: #999;
      cursor: pointer;
      margin-top: 20px;
      float: left;
    }
	  .goback_title{
		  margin-bottom: 60px;
		  cursor: pointer;
		  .iconfont{
			  font-size: 14px;
		  }
	  }
	  h2{
		  font-size: 22px;
		  margin-bottom: 30px;
	  }
	  .tabs-wrapper {
		  display: flex;
		  /*justify-content: space-around;*/
		  align-items: center;
		  span {
			  position: relative;
			  font-size: 14px;
			  color: #333;
			  cursor: pointer;
			  user-select: none;
			  font-weight: 600;
			  margin-right: 30px;
			  &.select {
				  color: #3395F9;
				  &::after {
					  content: '';
					  position: absolute;
					  top: 28px;
					  left: 0;
					  right: 0;
					  width: 56px;
					  height: 2px;
					  margin: 0 auto;
					  background: #3395F9;
				  }
			  }
		  }
	  }
	  .form {
		  // margin-top: 15px;
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
			  &.enterTrue{
				  border-bottom: 1px solid #47c026;
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
				  width: 93%;
				  height: 40px;
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
			  .icongou{
				  margin-right: 20px;
				  color:  #47c026;
			  }
			  .eye {
				  position: absolute;
				  top: 0;
				  right: 0;
				  height: 40px;
				  line-height: 40px;
				  font-size: 18px;
				  cursor: pointer;
			  }
		  }
	  }
	  .next {
		  display: block;
		  width: 100%;
		  margin-top: 60px;
	  }
  }
</style>
