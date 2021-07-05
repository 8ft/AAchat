<template>
	<div :class="{'login-wrapper':true,processing}">
		<div class="main">
			<!-- 二维码登录切换 -->
			<div class="change-login-wrapper">
				<div @click="useQrcodeLogin" v-show="isRoutineLogin" class="QR-code-login"></div>
				<div @click="changetype" v-show="!isRoutineLogin" class="routine-login"></div>
				<div class="hover-msg">
					{{isRoutineLogin ? $t('login.loginClassCode') : $t('login.loginClassAccount')}}
				</div>
			</div>
			<!--<div class="firstRun" v-show="firstRun">
				<div class="logo"></div>
				<h2 class="appName">
					{{$PROJECT_NAME}}
				</h2>
				<div class="form">
					<a-button @click="$router.push('/EnterPrise?type=reg')" class="login-btn" style="margin-top: 0; color: #999999;background: #FBFBFC">
						{{$t('login.newregister')}}
					</a-button>
					<a-button @click="$router.push('/EnterPrise?type=login1')" type="primary" style="margin-top: 16px;" class="login-btn">
						{{$t('login.loginBtn')}}
					</a-button>
				</div>
			</div>-->
			<!-- 账号登录 -->
			<div v-show="isRoutineLogin" class="routine-login-wrapper">
				<div class="goback_login" v-if="params.loginType === '0'" @click="_changeMode('1')">
					<i class="iconfont iconfanhui"> {{$t('common.return')}}</i>
				</div>
				<h2 class="login_title">
					{{params.loginType === '0' ? $t('login.loginById', { name: '' }) : $t('login.loginTo', { projectName: $PROJECT_NAME })}}
				</h2>
				<i18n path="login.loginTip1" tag="p" class="login_server">
					<template v-slot:serviceAgreement>
						<span @click="openLicenseWin()">{{$t('common.serviceAgreement')}}</span>
					</template>
					<template v-slot:privacyTitle>
						<span @click="openLicenseWin(1)">{{$t('common.privacyTitle')}}</span>
					</template>
				</i18n>
				<div v-if="params.loginType !== '0'">
					<a-tabs :active-key="params.loginType" @change="_changeMode" style="overflow: unset">
						<a-tab-pane key="1" :tab="$t('login.loginByMobile')">
							<!-- 手机登录 -->
							<div class="form">
								<div class="form-item">
									<custom-select :defaultAreaCode="defaultAreaCode" @selectResault="_selectResault"
										v-if="params.loginType === '1'"
									></custom-select>
									<input @keydown.13="_login" @keydown.229="() => {}" @input="_changeAccount" v-model.trim="params.account" style="flex: 1;"
										type="text" :placeholder="$t('common.tipMobileEnter')" maxlength="11"
										@blur.prevent="_validateAccount" ref="telAccount" oninput="value=value.replace(/[^\d]/g,'')"
									>
								</div>
								<div class="form-item">
									<!--<input @keydown.13="_login" @keydown.229="() => {}" v-model.trim="params.validateCode" type="text" maxlength="6" :placeholder="$t('common.getCode')" oninput = "value=value.replace(/[^\d]/g,'')">
									<a-button type="primary" @click="_getCode(buttonText)" :disabled="isDisabledGetCode" :loading="isGetting">{{buttonText}}</a-button>-->
									<input style="padding-right: 30px;ime-mode:active" @keydown.13="_login" @keydown.229="() => {}"
										oncopy="return false" onpaste="return false" oncontextmenu="return false"
										v-model.trim="params.password" :type="pwdType" :placeholder="$t('common.enterPwd')" maxlength="16"
										oninput="value=value.replace(/[\u4E00-\u9FA5]/g,'')"
									>
									<span @click="_openEye" class="eye iconfont" :class="isClose ? 'iconyincang' : 'iconkejian'"></span>
								</div>
							</div>
						</a-tab-pane>
						<a-tab-pane key="2" :tab="$t('login.loginByEmail')" force-render>
							<!-- 邮箱登录 -->
							<div class="form">
								<div class="form-item">
									<input @keydown.13="_login" @keydown.229="() => {}" @input="_changeAccount" v-model.trim="params.account" type="text"
										:placeholder="$t('common.tipEmailEnter')" maxlength="32" @blur.prevent="_validateAccount"
										ref="emailAccount"
									>
								</div>
								<div class="form-item">
									<!--<input @keydown.13="_login" @keydown.229="() => {}" v-model.trim="params.validateCode" maxlength="6" type="text" :placeholder="$t('common.tipCodeEnter')" oninput = "value=value.replace(/[^\d]/g,'')">
									<a-button @click="_getCode(buttonText)" type="primary" :disabled="isDisabledGetCode" :loading="isGetting">{{buttonText}}</a-button>-->
									<input style="padding-right: 30px;" @keydown.13="_login" @keydown.229="() => {}"
										oncopy="return false" onpaste="return false" oncontextmenu="return false"
										v-model.trim="params.password" :type="pwdType" :placeholder="$t('common.enterPwd')" maxlength="16"
									>
									<span @click="_openEye" class="eye iconfont" :class="isClose ? 'iconyincang' : 'iconkejian'"></span>
								</div>
							</div>
						</a-tab-pane>
					</a-tabs>
					<div class="form">
						<a-button :loading="processing" @click="_login" type="primary" class="login-btn">
							{{$t('login.loginBtn')}}
						</a-button>
						<div class="special">
							<a-checkbox class="left" :checked="autoLogin" @change="autoLoginChange">
								{{$t('login.autoLogin')}}
							</a-checkbox>
							<div class="right">
								<router-link to="/forgetPsd">
									{{$t('login.forgotPwd')}}
								</router-link>
							</div>
						</div>
					</div>
				</div>
				<!-- AAid登录登录 -->
				<div v-show="params.loginType === '0'" class="form">
					<div class="form-item">
						<input @keydown.13="_login" @keydown.229="() => {}" v-model.trim="params.account" type="text"
							:placeholder="$t('common.tipAAidEnter')"
						>
					</div>
					<div class="form-item">
						<input style="padding-right: 30px;" @keydown.13="_login" @keydown.229="() => {}"
							oncopy="return false" onpaste="return false" oncontextmenu="return false"
							v-model.trim="params.password" :type="pwdType" :placeholder="$t('common.enterPwd')" maxlength="16"
						>
						<span @click="_openEye" class="eye iconfont" :class="isClose ? 'iconyincang' : 'iconkejian'"></span>
					</div>
					<!--占位用div-->
					<div v-if="params.loginType === '0'" style="height: 2px;"></div>
					<a-button :loading="processing" @click="_login" type="primary" class="login-btn">
						{{$t('login.loginBtn')}}
					</a-button>
					<div class="special">
						<a-checkbox class="left" :checked="autoLogin" @change="autoLoginChange">
							{{$t('login.autoLogin')}}
						</a-checkbox>
						<div class="right">
							<router-link to="/forgetPsd">
								{{$t('login.forgotPwd')}}
							</router-link>
							<!--<router-link to="/EnterPrise?type=reg">
								{{$t('login.register')}}
							</router-link>-->
						</div>
					</div>
				</div>
				<!-- 手机登录 -->
				<!--<div v-show="params.loginType === '1'" class="form">
					<div class="form-item">
						<custom-select :defaultAreaCode="$store.state.Setting.sysConfig.areaCode" @selectResault="_selectResault"
							v-if="params.loginType === '1'"
						></custom-select>
						<input @keydown.13="_login" @keydown.229="() => {}" v-model.trim="params.account" style="flex: 1;"
							type="text" :placeholder="$t('common.tipMobileEnter')" maxlength="11"
							@blur.prevent="_validateAccount" ref="telAccount" oninput="value=value.replace(/[^\d]/g,'')"
						>
					</div>
					<div class="form-item">
						&lt;!&ndash;<input @keydown.13="_login" @keydown.229="() => {}" v-model.trim="params.validateCode" type="text" maxlength="6" :placeholder="$t('common.getCode')" oninput = "value=value.replace(/[^\d]/g,'')">
            <a-button type="primary" @click="_getCode(buttonText)" :disabled="isDisabledGetCode" :loading="isGetting">{{buttonText}}</a-button>&ndash;&gt;
						<input style="padding-right: 30px;ime-mode:active" @keydown.13="_login" @keydown.229="() => {}"
							oncopy="return false" onpaste="return false" oncontextmenu="return false"
							v-model.trim="params.password" :type="pwdType" :placeholder="$t('common.enterPwd')" maxlength="16"
							oninput="value=value.replace(/[\u4E00-\u9FA5]/g,'')"
						>
						<span @click="_openEye" class="eye iconfont" :class="isClose ? 'iconyincang' : 'iconkejian'"></span>
					</div>
					<div class="form-item special">
						<a-checkbox class="left" :checked="autoLogin" @change="autoLoginChange">
							{{$t('login.autoLogin')}}
						</a-checkbox>
						<div class="right">
							<router-link to="/EnterPrise?type=reg">
								{{$t('login.register')}}
							</router-link>
						</div>
					</div>
				</div>-->
				<!-- 邮箱登录 -->
				<!--<div v-show="params.loginType === '2'" class="form">
					<div class="form-item">
						<input @keydown.13="_login" @keydown.229="() => {}" v-model.trim="params.account" type="text"
							:placeholder="$t('common.tipEmailEnter')" maxlength="32" @blur.prevent="_validateAccount"
							ref="emailAccount"
						>
					</div>
					<div class="form-item">
						&lt;!&ndash;<input @keydown.13="_login" @keydown.229="() => {}" v-model.trim="params.validateCode" maxlength="6" type="text" :placeholder="$t('common.tipCodeEnter')" oninput = "value=value.replace(/[^\d]/g,'')">
            <a-button @click="_getCode(buttonText)" type="primary" :disabled="isDisabledGetCode" :loading="isGetting">{{buttonText}}</a-button>&ndash;&gt;
						<input style="padding-right: 30px;" @keydown.13="_login" @keydown.229="() => {}"
							oncopy="return false" onpaste="return false" oncontextmenu="return false"
							v-model.trim="params.password" :type="pwdType" :placeholder="$t('common.enterPwd')" maxlength="16"
						>
						<span @click="_openEye" class="eye iconfont" :class="isClose ? 'iconyincang' : 'iconkejian'"></span>
					</div>
					<div class="form-item special">
						<a-checkbox class="left" :checked="autoLogin" @change="autoLoginChange">
							{{$t('login.autoLogin')}}
						</a-checkbox>
						<div class="right">
							<router-link to="/EnterPrise?type=reg">
								{{$t('login.register')}}
							</router-link>
						</div>
					</div>
				</div>-->
				<!--<a-button @click="_login" type="primary" class="login-btn">
					{{$t('login.loginBtn')}}
				</a-button>-->
				<!--占位用div-->
				<div v-if="params.loginType === '0'" style="height: 120px;"></div>
				<div class="login-mode" v-show="params.loginType !== '0'">
					<!--<span @click="_changeMode('0')" v-show="params.loginType !== '0'">{{$t('login.loginById')}}</span>
					<span @click="_changeMode('1')" v-show="params.loginType !== '1'">{{$t('login.loginByMobile')}}</span>
					<span @click="_changeMode('2')" v-show="params.loginType !== '2'">{{$t('login.loginByEmail')}}</span>-->
					<p>{{$t('login.moreLoginMethods')}}</p>
					<div class="line"></div>
					<a-button @click="_changeMode('0')">
						{{$t('login.loginById')}}
					</a-button>
				</div>
			</div>
			<!-- 二维码登录 -->
			<div v-show="!isRoutineLogin" class="QR-login-wrapper">
				<div v-if="!isScanCodeFinish">
					<span class="note-cutting">{{$t('login.loginClassCode')}}</span>
					<p class="second_note">
						{{$t('login.qrTip', { projectName: $PROJECT_NAME})}}
					</p>
					<div class="QR-code-img" :class="{'ismac': $utils.os.isMac}">
						<div class="qrshuaxin">
							<div @click="_handleGetQrcode" :title="$t('login.refreshQRCode')">
								<i class="iconfont iconshuaxin"></i>
							</div>
						</div>
						<qriously style="position: absolute" :value="qrcode" :size="195" v-show="!qrcodeLoading" />
						<a-spin :spinning="qrcodeLoading" size="large"></a-spin>
					</div>
					<div class="bottom-gird">
						<a-checkbox class="left" :checked="autoLogin" @change="autoLoginChange">
							{{$t('login.autoLogin')}}
						</a-checkbox>
						<!--<div class="right">
							<router-link to="/EnterPrise?type=reg">
								{{$t('login.register')}}
							</router-link>
						</div>-->
					</div>
				</div>
				<div v-else style="text-align:center">
					<img src="@/assets/img/img111.png">
					<span class="note-cutting" style="margin: 60px 0 10px">{{$t('login.confirmLogin')}}</span>
					<p class="second_note">
						{{$t('login.scanCodeFinish', [$PROJECT_NAME])}}
					</p>
				</div>
			</div>
		</div>
		<i18n class="bottom_regist" path="login.noAccountTip" tag="p" for="login.registerNow" v-if="$route.query.loginByQr === undefined">
			<!--2.2.0开始，注册不需要输入企业代码，所以直接到注册页面-->
			<!--<span @click="$router.push('/EnterPrise?type=reg')">{{$t('login.registerNow')}}</span>-->
			<router-link to="/register">
				{{$t('login.registerNow')}}
			</router-link>
		</i18n>
		<!--<p class="clickchange" :class="{'winclickchange': !$utils.os.isMac}" v-show="isRoutineLogin && !firstRun && !$store.state.Setting.loginLoading">
			<span class="bottom_orangeName">{{$store.state.Setting.sysConfig.organName}}</span><span @click="$router.push('/EnterPrise?type=login1')" style="margin-left: 5px;">切换企业</span>
		</p>-->
	</div>
</template>

<script>
	import CustomSelect from '@/components/common/CustomSelect'
	import { isPhone, isCnPhone, isEmail } from '@/utils/web'
	const { ipcRenderer } = require('electron')

	var timer = [] // 定义计算器全局变量

	export default {
		name: 'Login',
		components: {
			CustomSelect
		},
		data() {
			return {
				defaultAreaCode: this.$store.state.Setting.sysConfig.areaCode,
				processing: false,
				pageShow: true,
				autoLogin: this.$store.state.Setting.sysConfig.autoLogin,
				isGetting: false,
				rightMenuType1: 'rightMenuType1',
				isClose: true,
				isRoutineLogin: this.$route.query.loginByQr !== undefined ? !this.$route.query.loginByQr : !(this.$store.state.Setting.sysConfig.lastLoginByQr === 1), // 常规登录和二维码登录
				pwdType: 'password',
				loginMode: 0, // 默认显示哪种输入框 0:id  1:手机  2:邮箱登录
				params: {
					account: this.$store.state.Setting.sysConfig.loginName,
					password: '',
					areaCode: this.$store.state.Setting.sysConfig.areaCode,
					loginType: this.$store.state.Setting.sysConfig.loginType
					// validateCode: ''
				},
				buttonText: this.$t('common.getCode'),
				isDisabledGetCode: false,
				hasGetMsg: false,
				getLoginQrCode: null,
				getServerTime: null,
				qrcodeLoading: true,
				qrcode: '',
				qrcodeTimestamp: null,
				pollingQrCodeLogin: null,
				pollingLoginTimer: '',
				isScanCodeFinish: false, // 手机是否扫码成功
				isQRerror: false, // 二维码是否获取成功，成功：false，失败：true,
				firstRun: this.$store.state.Setting.sysConfig.organId === '' // 是否显示初始登录注册
			}
		},
		watch: {
			'isRoutineLogin': async function(nVal) {
				this.QRlogin()
			},
			'$route.fullPath'() { // 登录成功，跳转到chat前，初始化数据接口报错。回到登录界面,参数t是时间戳，避免监控不到路由变化
				if (this.$route.query.t) this.$store.commit('Setting/SET_LOGINLOADING', false)
			},
			'$route.path'() {
				// 路由变化，停止二维码状态轮询
				this.isRoutineLogin = true
				if (this.$store.state.Setting.sysConfig.organId) {
					this.firstRun = false
				}
			}
		},
		created() {
			/* if (this.$store.state.User.accountInfo.userId) {
				// this.$store.commit('initState')
			}*/
		},
		async mounted() {
			const loginParams = this.$store.state.loginParams
			console.log(loginParams)
			if (loginParams) { // 如果有缓存登录信息，说明是从二次登录页面返回的,需要恢复之前的状态
				const params = {
					account: loginParams.tempParams.account,
					loginType: loginParams.loginType || 0,
					autoLogin: loginParams.autoLogin,
					password: loginParams.tempParams.password || ''
				}

				this.loginType = loginParams.loginType
				this.autoLogin = loginParams.autoLogin
				if (params.loginType == 1 && this.isRoutineLogin) {
					params.areaCode = loginParams.tempParams.areaCode
					this.defaultAreaCode = loginParams.tempParams.areaCode
				}
				this.params = params
			} else if (this.autoLogin) {
				this.$store.commit('Setting/SET_LOGINLOADING', true)
				this.$utils.fun.waiting(1000).then(async() => {
					let params
					try {
						const res = this.$store.state.Setting.sysConfig
						await this.$utils.fun.userResources({ userId: res.lastUserId })
						params = {
							account: res.lastLoginByQr === 0 ? res.loginName : res.lastLogin,
							loginType: 0,
							autoLogin: res.lastLoginByQr === 0
						}
						if (this.params.loginType == 1 && this.isRoutineLogin) params.areaCode = res.areaCode
						const userInfo = await this.$utils.api.user.login({
							data: params, // lastLoginByQr,扫码登录，用token自动登录
							custError: true
						}).get() // 刷新token变更在线状态
						console.log('userInfo_mounted:', userInfo)
						const res_userResources = await this.$utils.fun.userResources({ userId: userInfo.data.userId, userInfo: userInfo.data })
						if (!res_userResources.isInit && userInfo.data.auditStatus > 0) {
							// 判断是否被移出企业
							await this.$utils.fun.clearLocalData(userInfo.data.organRemoveTime, userInfo.data.organId)
							this.$store.commit('updateClearLocalDataTime', userInfo.data.timestamp)
							await this.$utils.fun.userResources({ userId: userInfo.data.userId, userInfo: userInfo.data })
						}
						if (userInfo.data.auditStatus === 0) {
							this.$router.push('/registerResult')
							return
						}

						await this.loginMethod(userInfo.data)
						await this.$utils.api.user.directEnterOrQuit({ type: '0' }).get() // 通知APP
						// this.pageShow = false
						setTimeout(() => {
							this.$store.commit('Setting/SET_LOGINLOADING', false)
							this.$router.push({ path: '/chat', replace: true, query: { resize: true }})
						}, 50)
					} catch (e) {
						this.$store.commit('Setting/SET_LOGINLOADING', false)
						if (e.code === 604) {
							this.$utils.fun.openUpdateWin(e)
							return
						}
						// 勾选自动登录，app端扫码登录后pc端退出登录，app修改密码pc重新登录
						if (!this.isRoutineLogin && e.code === 506001) {
							this._handleGetQrcode()
						} else if (e.code === 601022) { // 需要二次验证
							this.$store.commit('updateLoginParams', { bindInfo: e.data, tempParams: params, autoLogin: this.autoLogin, loginType: this.params.loginType })// 缓存登录接口需要的参数
							this.$router.push('/SecondVerification')
							return
						} else {
							this.$message.error(this.$t('login.autoLoginFailed'))
						}
						await this.$utils.fun.clearUserInfo()
						this.$store.commit('initState')
					}
				})
			} else {
				if (!this.isRoutineLogin) this.QRlogin()
			}
		},
		beforeDestroy() {
			clearTimeout(this.pollingLoginTimer)
		},
		methods: {
			gotoReg() {
				if (this.$store.state.Setting.sysConfig.isECodeMust) {
					this.$router.push('/EnterPrise?type=reg')
				} else {
					this.$router.push('/register')
				}
			},
			openLicenseWin(type) {
				if (!this.onlineCheck()) return
				this.$utils.fun.createWin({ action: 'openLicenseWin', params: type })
			},
			async QRlogin() {
				try {
					if (!this.isRoutineLogin) {
						this.isScanCodeFinish = false
						const sysConfig = await this.$utils.fun.getSysConfig()
						this.qrcodeTimestamp = await this.getServerTimeFun()
						sysConfig.loginQrcodeTime = sysConfig.loginQrcodeTime || ''
						if (!sysConfig.loginQrcode || !sysConfig.loginQrcodeTime || this.dateDiff(sysConfig.loginQrcodeTime, this.qrcodeTimestamp) > 10) {
							await this.getQrcode()
						} else {
							this.qrcode = sysConfig.loginQrcode
						}
						this.pollingLogin()
					} else {
						if (this.pollingQrCodeLogin) {
							this.pollingQrCodeLogin.abort()
							this.pollingQrCodeLogin = null
						}
						if (this.getServerTime) {
							this.getServerTime.abort()
							this.getServerTime = null
						}
						if (this.pollingLoginTimer) clearTimeout(this.pollingLoginTimer)
					}
					this.qrcodeLoading = false
				} catch (e) {
					this.qrcodeLoading = false
					this.isQRerror = true
				}
			},
			getServerTimeFun() {
				return new Promise((resolve, reject) => {
					if (this.getServerTime) this.getServerTime.abort()
					this.getServerTime = this.$utils.api.thirdpart.getServerTime()
					this.getServerTime.get().then(res => {
						resolve(res.data.timestamp)
					}).catch(e => {
						reject(e)
					})
				})
			},
			async pollingLogin() {
				try {
					this.pollingQrCodeLogin = this.$utils.api.user.pollingQrCodeLogin()
					const timestamp = await this.getServerTimeFun()
					const userInfo = await this.pollingQrCodeLogin.get({ data: { timestamp, uuid: this.qrcode }, custError: true })
					console.log('userInfo_polling:', userInfo)
					ipcRenderer.send('enterprise', userInfo.data.organId)
					if (this.pollingLoginTimer) clearTimeout(this.pollingLoginTimer)
					const res_userResources = await this.$utils.fun.userResources({ userId: userInfo.data.userId, userInfo: userInfo.data })
					if (!res_userResources.isInit) {
						// 判断是否被移出企业
						await this.$utils.fun.clearLocalData(userInfo.data.organRemoveTime, userInfo.data.organId)
						this.$store.commit('updateClearLocalDataTime', userInfo.data.timestamp)
						await this.$utils.fun.userResources({ userId: userInfo.data.userId, userInfo: userInfo.data })
					}

					await this.loginMethod(userInfo.data)
					const hisorganNameList = window._.cloneDeep(this.$store.state.Setting.sysConfig.hisorganNameList)
					const index = hisorganNameList.findIndex(item => {
						return item.organCode === userInfo.data.organCode
					})
					if (index > -1) {
					} else {
						hisorganNameList.push({
							priseName: userInfo.data.organName,
							organCode: userInfo.data.organCode
						})
					}
					await this.$store.dispatch('Setting/set_sysConfig', {
						data: {
							autoLogin: this.autoLogin,
							lastLogin: userInfo.data.accountCode,
							lastUserId: userInfo.data.userId,
							loginQrcodeTime: '',
							loginQrcode: '',
							lastLoginByQr: 1,
							organId: userInfo.data.organId,
							organName: userInfo.data.organName,
							organCode: userInfo.data.organCode,
							hisorganNameList
						}
					})
					// this.pageShow = false
					setTimeout(() => this.$router.push({ path: '/chat', replace: true, query: { resize: true }}), 50)
				} catch (e) {
					console.log(222, e)
					if (e.code === 604) {
						this.$utils.fun.openUpdateWin(e)
						return
					}
					if (e.code === 899999) {
						this.$message.error(e.message)
						this.isQRerror = true
					} else if (e.code === 506002 || e.code === 401001 || e.code === 1001001 || e.code === 506006) { // 506002二维码失效,401001接口签名无效
						if (this.pollingLoginTimer) clearTimeout(this.pollingLoginTimer)
						await this.getQrcode()
						this.pollingLoginTimer = setTimeout(() => this.pollingLogin(), 1000)
					} else if (e.code === 506004) { // 等待确认中
						this.pollingLoginTimer = setTimeout(() => this.pollingLogin(), 1000)
					} else if (e.code === 506007) { // 扫码完成，等待确认
						this.isScanCodeFinish = true
						this.pollingLoginTimer = setTimeout(() => this.pollingLogin(), 1000)
					} else if (e.code === 506008) { // 扫码完成，去掉登录
						this.isScanCodeFinish = false
						this._handleGetQrcode()
					} else {
						this.$message.error(e.message || this.$t('common.netErrorTip[0]'))
						this.isQRerror = true
					}
				}
			},
			async _handleGetQrcode() {
				try {
					this.isQRerror = false
					if (this.pollingLoginTimer) clearTimeout(this.pollingLoginTimer)
					this.qrcodeTimestamp = await this.getServerTimeFun()
					await this.getQrcode()
					this.pollingLoginTimer = setTimeout(() => this.pollingLogin(), 1000)
				} catch (e) {
					this.isQRerror = true
				}
			},
			getQrcode() {
				return new Promise(async(resolve, reject) => {
					try {
						this.qrcodeLoading = true
						if (this.getLoginQrCode) this.getLoginQrCode.abort()
						this.getLoginQrCode = this.$utils.api.user.getLoginQrCode()
						const params = {
							timestamp: this.qrcodeTimestamp
						}
						if (this.qrcode) params.oldUuid = this.qrcode
						const res = await this.getLoginQrCode.get(params)
						this.qrcode = res.data
						await this.$store.dispatch('Setting/set_sysConfig', {
							data: {
								loginQrcodeTime: this.qrcodeTimestamp,
								loginQrcode: res.data
							}
						})
						this.getLoginQrCode = null
						this.qrcodeLoading = false
						this.isQRerror = false
						resolve(res)
					} catch (e) {
						this.qrcodeLoading = false
						this.isQRerror = true
						/* if (e.code !== 1001001) this.qrcode = '出错啦！'
						this.$message.error(e.message)*/
						reject(e)
					}
				})
			},
			dateDiff(date1, date2) { // 计算date1和date2的时间差，date2大于date1返回结果为正值
				date1 = date1 ? window.$moment(date1) : window.$moment()
				date2 = date2 ? window.$moment(date2) : window.$moment()
				return date2.diff(date1, 'minute')
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
			autoLoginChange(e) {
				this.autoLogin = e.target.checked
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
			useQrcodeLogin() {
				this.isRoutineLogin = false
				this.firstRun = false
			},
			_changeMode(mode) {
				this.isClose = true
				this.params.loginType = mode
				if (this.$store.state.Setting.sysConfig.loginType === mode) {
					this.params.account = this.$store.state.Setting.sysConfig.loginName
				} else {
					this.params.account = ''
				}
				this.params.password = ''
				this.params.areaCode = this.$store.state.Setting.sysConfig.areaCode
				// this.params.validateCode = ''
				clearInterval(timer['getCode'])
				timer = []
				this.buttonText = this.$t('common.getCode')
			},
			_selectResault(value) {
				this.params.areaCode = value
			},
			_login(e) {
				const { loginType, account } = this.params
				if (loginType === '0') {
					if (!this.params.account) {
						this.$message.error(this.$t('common.tipAAidEnter'))
						return
					}
				} else if (loginType === '1') {
					if (!account) {
						this.$message.error(this.$t('common.tipMobileEnter'))
						return
					} else {
						if (this.params.areaCode == '+86') {
							if (!isCnPhone(account)) {
								this.$message.error(this.$t('common.tipMobileFormatError'))
								return
							}
						} else {
							if (!isPhone(account)) {
								this.$message.error(this.$t('common.tipMobileFormatError'))
								return
							}
						}
					}
					/* if (!validateCode) {
							this.$message.error(this.$t('common.tipCodeEnter'))
							return
						}*/
				} else if (loginType === '2') {
					if (!account) {
						this.$message.error(this.$t('common.tipEmailEnter'))
						return
					} else {
						if (!isEmail(account)) {
							this.$message.error(this.$t('common.tipEmailFormatError'))
							return
						}
					}
					/* if (!validateCode) {
							this.$message.error(this.$t('common.tipCodeEnter'))
							return
						}*/
				}
				if (!this.params.password) {
					this.$message.error(this.$t('common.enterPwd'))
					return
				}
				/* if (this.$store.state.Setting.sysConfig.organId == 0 && this.$store.state.Setting.sysConfig.isECodeMust) {
					this.$message.error(this.$t('login.enterEnterpriseCode'))
					return
				}*/
				this.processing = true
				// ipcRenderer.send('enterprise', this.$store.state.Setting.sysConfig.organId)
				this.$utils.fun.waiting(1000).then(async() => {
					let tempParams
					try {
						tempParams = Object.assign({}, this.params)
						tempParams.loginType = 0
						// 2.0登录方式不为手机时区号传空
						if (loginType !== '1') tempParams.areaCode = ''
						const userInfo = await this.$utils.api.user.login({ data: tempParams, custError: true }).get()
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
								loginType: this.params.loginType,
								loginName: this.params.account,
								areaCode: this.params.areaCode,
								loginQrcodeTime: '',
								loginQrcode: '',
								organId: userInfo.data.organId
							}
						})
						if (userInfo.data.auditStatus === 0) {
							this.processing = false
							this.$router.push('/registerResult')
							return
						}

						await this.loginMethod(userInfo.data)
						// this.pageShow = false
						setTimeout(() => {
							this.processing = false
							this.$router.push({ path: '/chat', replace: true, query: { resize: true }})
						}, 50)
					} catch (e) {
						console.log(e)
						this.processing = false
						if (e.code === 604) {
							this.$utils.fun.openUpdateWin(e)
							return
						}
						// 登录未注册的手机号码和邮箱不提示，直接进入注册填写密码页面
						if (e.code === 601001 || e.code === 601002) {
							this.$router.push({
								path: '/register', query: {
									noRegister: true,
									account: this.params.account,
									areaCode: this.params.areaCode,
									// validateCode: this.params.validateCode,
									isSelectTel: this.params.loginType === '1'
								}
							})
						} else if (e.code === 601022) { // 需要二次验证
							this.$store.commit('updateLoginParams', { bindInfo: e.data, tempParams, autoLogin: this.autoLogin, loginType: this.params.loginType })// 缓存登录接口需要的参数
							this.$router.push('/SecondVerification')
							return
						} else {
							this.$message.error(e.message || this.$t('common.netErrorTip[0]'))
						}
					}
				})
			},
			// 检测账号
			_validateAccount() {
				// 手机注册
				if (this.params.loginType == 1) {
					if (!this.params.account) {
						return
					} else {
						if (this.params.areaCode === '+86') {
							if (!isCnPhone(this.params.account)) {
								this.$message.error(this.$t('common.tipMobileFormatError'))
							}
						} else {
							if (!isPhone(this.params.account)) {
								this.$message.error(this.$t('common.tipMobileFormatError'))
								return
							}
						}
					}
				} else {
					//  邮箱注册
					if (!this.params.account) {
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
				if (this.params.loginType == 1) {
					if (!this.params.account) {
						this.isDisabledGetCode = true
						return
					} else {
						if (this.params.areaCode === '+86') {
							if (!isCnPhone(this.params.account) || timer['getCode'] != undefined) {
								this.isDisabledGetCode = true
							} else {
								this.isDisabledGetCode = false
							}
						} else {
							if (!isPhone(this.params.account) || timer['getCode'] != undefined) {
								this.isDisabledGetCode = true
								return
							} else {
								this.isDisabledGetCode = false
							}
						}
					}
				} else {
					//  邮箱注册
					if (!this.params.account) {
						this.isDisabledGetCode = true
						return
					} else {
						if (!isEmail(this.params.account) || timer['getCode'] != undefined) {
							this.isDisabledGetCode = true
							return
						} else {
							this.isDisabledGetCode = false
						}
					}
				}
			},
			_getCode(buttonText) {
				const { loginType, account } = this.params
				if (loginType === '1') {
					if (!account) {
						this.$message.error(this.$t('common.tipMobileEnter'))
						return
					} else {
						if (!isPhone(account)) {
							this.$message.error(this.$t('common.tipMobileFormatError'))
							return
						}
					}
				} else if (loginType === '2') {
					if (!account) {
						this.$message.error(this.$t('common.tipEmailEnter'))
						return
					} else {
						if (!isEmail(account)) {
							this.$message.error(this.$t('common.tipEmailFormatError'))
							return
						}
					}
				}
				this.buttonText = this.$t('common.requesting')
				this.isGetting = true
				const codeParams = {
					type: this.params.loginType == 1 ? '2' : '3', // 0: 手机注册; 1: 邮箱注册
					areaCode: this.params.areaCode,
					account: this.params.account
				}
				this.$utils.fun.waiting(3000).then(() => {
					this.$utils.api.public.getCode(codeParams).get().then(() => {
						this.isGetting = false
						setTimeout(() => {
							this.isSubmit = false
						}, 800) // 加个定时器是为了登录loading平滑显示，不然不显示出来
						this._countDown(buttonText)
					}).catch(e => {
						this.isGetting = false
						this.buttonText = this.$t('common.getCode')
					})
				})
			},
			_countDown(buttonText) {
				this.isDisabledGetCode = true
				let time = 60
				this.buttonText = '60s'
				timer['getCode'] = setInterval(() => {
					time--
					this.buttonText = time + 's'
					if (time === 0) {
						time = 0
						clearInterval(timer['getCode'])
						timer = []
						this.buttonText = this.$t('common.reGetCode')
						this.isDisabledGetCode = false
					}
				}, 1000)
			},
			changetype() {
				if (this.$route.query.loginByQr === undefined) {
					this.isRoutineLogin = true
					this.firstRun = this.$store.state.Setting.sysConfig.organId === ''
				} else {
					this.$router.push({
						path: 'EnterPrise'
					})
				}
			}
		}
	}
</script>
<style lang="scss">
	.login-wrapper {
		width: 100%;
		height: 100%;
		&.processing{
			pointer-events: none;
		}
		.main {
			overflow: hidden;
			position: relative;
			padding: 0 30px;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			.firstRun{
				width: 100%;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.change-login-wrapper {
				position: absolute;
				top: 0px;
				right: 0px;
				width: 70px;
				height: 70px;
				&:hover {
					.hover-msg {
						display: block;
					}
				}
				.QR-code-login {
					width: 70px;
					height: 70px;
					@include retinize('erweima');
					background-size: cover;
					cursor: pointer;
					&:hover {
						@include retinize('erweimayiru');
					}
				}
				.routine-login {
					width: 70px;
					height: 70px;
					@include retinize('zhanghao');
					background-size: cover;
					cursor: pointer;
					&:hover {
						@include retinize('zhanghao2');
					}
				}
				.hover-msg {
					display: none;
					position: absolute;
					top: 10px;
					right: 60px;
					height: 34px;
					line-height: 34px;
					color: #fff;
					font-size: 12px;
					padding-left: 12px;
					@include retinize('xingzhuang596');
					background-size: cover;
					background-position: right center;
					border-radius: 5px 0 0 5px;
					padding-right: 20px;
					white-space:nowrap
				}
			}
			.logo {
				display: block;
				width: 80px;
				height: 80px;
				margin: 0 auto;
				@include retinize('logo');
			}
			.routine-login-wrapper{
				width: 100%;
				.goback_login{
					font-size: 14px;
					color: #666666;
					margin: 10px 0 37px;
					cursor: pointer;
				}
				.login_title{
					margin-bottom: 5px;
					font-size: 22px;
					font-weight: bold;
					color: #333333;
				}
				.login_server{
					font-size: 14px;
					color: #666666;
					line-height: 150%;
					span{
						cursor: pointer;
						color: #2e87ff
					}
				}
			}
			.form {
				/*margin-top: 20px;*/
				/*/deep/ .ant-btn {
					width: 80px;
					height: 27px;
					padding: 0 5px;
					span {
						// color: #fff;
						font-size: 12px;
						line-height: 24px;
					}
				}*/
				.special {
					display: flex;
					justify-content: space-between;
					position: relative;
					margin-bottom: 10px;
					padding-top: 7px;
					height: 52px;
					a {
						/*position: relative;*/
						color: #999999;
						font-size: 12px;
						&:hover {
							color: #2E87FF;
						}
						&.line {
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
					span{
						color: #999999;
					}
				}
				.form-item {
					position: relative;
					display: flex;
					align-items: center;
					height: 42px;
					border-bottom: 1px solid #E6E6E6;
					margin-bottom: 10px;
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
			/deep/ .ant-tabs-bar{
				border-bottom: none;
				.ant-tabs-tab{
					padding: 9px 0px;
					margin-right: 43px;
				}
			}
			/deep/ .ant-tabs-content{
				margin-top: -6px;
			}
			.firstRun{
				.appName{
					font-family: Verdana;
					font-size: 22px;
					text-align: center;
					margin: 27px auto 60px;
				}
				.form{
					/deep/ .ant-btn {
						padding: 0 5px;
						span {
							// color: #fff;
							font-size: 14px;
							line-height: 24px;
						}
					}
				}
				p{
					text-align: center;
					font-size: 14px;
					color: #999999;
					margin-top: 60px;
				}
			}
			/deep/ .ant-checkbox-inner {
				width: 12px;
				height: 12px;
				&::after {
					top: 0;
					left: 3px;
					width: 5px;
					height: 8px;
				}
			}
			/deep/ .ant-checkbox-wrapper {
				font-size: 12px;
			}
			.login-btn {
				display: block;
				width: 100%;
				margin-top: 12px;
				height: 36px;
				/*background-color: #abcfff;
				border: 1px solid #abcfff;*/
				border-radius: 4px;
				font-size: 16px;
			}
			.login-mode {
				position: relative;
				margin-top: 28px;
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
			.QR-login-wrapper {
				.QR-code-img {
					width: 195px;
					height: 199px;
					margin: 40px auto;
					display: flex;
					align-items: center;
					justify-content: center;
					position: relative;
					/*border: 1px solid #ececec;*/
					.qrshuaxin {
						position: absolute;
						top: 0;
						bottom: 0;
						left: 0;
						right: 0;
						z-index: 10;
						display: flex;
						align-items: center;
						justify-content: center;
						&:hover {
							div {
								display: flex
							}
						}
						div {
							width: 50px;
							height: 50px;
							border-radius: 50%;
							background: #fff;
							display: none;
							align-items: center;
							justify-content: center;
							box-shadow: 0 0 10px rgba(0, 0, 0, .5);
							cursor: pointer;
						}
					}
					.iconfont {
						margin-top: 2px;
						font-size: 40px;
						color: #999;
					}
					&:hover {
						.iconfont {
							opacity: 1;
						}
					}
				}
				.ismac{
					margin-top: 35px;
				}
				.note-cutting {
					display: block;
					margin-bottom: 0px;
					font-size: 22px;
					font-weight: bold;
					color: #333;
					text-align: center;
					line-height: 32px;
				}
				.second_note{
					font-size: 14px;
					color: #666666;
					margin-top: 8px;
					text-align: center;
				}
				.bottom-gird {
					display: flex;
					justify-content: center;
					align-items: center;
					a {
						position: relative;
						color: #999999;
						font-size: 12px;
						&:hover {
							color: #2E87FF;
						}
					}
					span{
						color: #999;
					}
				}
			}
		}
	}
</style>
