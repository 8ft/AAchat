<template>
	<div>
		<a-modal
			:visible="activeModal!==''"
			class="notification-IM login-devices"
			:title="$t('setting.loginDevices')"
			centered
			:width="460"
			:maskClosable="false"
			:footer="null"
			@cancel="$emit('modalChange', '')"
			:afterClose="init"
		>
			<div class="desc">
				{{$t('kickoutDevice.desc[0]')}}<br>{{$t('kickoutDevice.desc[1]')}}
			</div>
			<div class="list">
				<div :class="{device:true,online:device.onlineState==1}" v-for="device in devices" :key="device.id" @click="preLogout(device)">
					<div class="device-model">
						<div class="online-state"></div>
						<div class="content">
							{{device.deviceModel}}
						</div>
						<div class="tag" v-if="isCurDevice(device)">
							{{$t('kickoutDevice.native')}}
						</div>
					</div>
					<div class="device-name" v-if="device.deviceName">
						{{device.deviceName}}
					</div>
					<div class="device-organ" v-if="device.organName">
						{{getOrganName(device)}}
					</div>

					<span class="iconfont iconxiayiye" v-if="device.onlineState==1"></span>
				</div>
			</div>
		</a-modal>

		<!--退出确认框-->
		<a-modal
			class="notification-IM"
			centered
			:width="436"
			:maskClosable="false"
			:title="$t('common.prompt')"
			:visible="activeModal==='logoutConfirm'"
			@cancel="$emit('modalChange', 'main');logoutDevice={};"
		>
			<p>{{$t('common.logoutSure')}}</p>
			<template #footer>
				<a-button type="primary" :loading="processing==='getCode'||processing==='logout'" @click="preGetCode">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button @click="$emit('modalChange', 'main')">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>

		<!--退出登录验证-->
		<a-modal
			class="notification-IM modal-logout"
			centered
			:width="436"
			:maskClosable="false"
			:title="$t('kickoutDevice.exitVerification')"
			:visible="activeModal==='logout'"
			@cancel="$emit('modalChange', 'main');logoutDevice={};"
		>
			<p class="tip" v-show="validateType==8">
				{{getCodeError_phone?$t('kickoutDevice.curPhone'):$t('kickoutDevice.sent')}} {{areaCode}} {{userMobile}}
			</p>
			<p class="tip" v-show="validateType==9">
				{{getCodeError_email?$t('kickoutDevice.curEmail'):$t('kickoutDevice.sent')}} {{shortEmail}}
			</p>
			<div class="code-input">
				<input v-model="validateCode" type="text" maxlength="6" oninput="value=value.replace(/[^\d]/g,'')">
				<a-button type="primary" :loading="processing==='getCode'" :disabled="(validateType==8&&countDown_phone>0)||(validateType==9&&countDown_email>0)" @click="getCode">
					{{btn_getCode_txt}}
				</a-button>
			</div>
			<div class="type-switch" @click="switchType" v-if="userEmail&&userMobile">
				{{validateType==9?$t('kickoutDevice.phoneVerification'):$t('kickoutDevice.emailVerification')}}
			</div>

			<template #footer>
				<a-button type="primary" :loading="processing==='logout'" @click="logOut">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button @click="$emit('modalChange', 'main')">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>
	</div>
</template>
<script>
	import { isPhone, isCnPhone, isEmail } from '@/utils/web'
	export default {
		name: 'LoginDevices',
		model: {
			prop: 'activeModal',
			event: 'modalChange'
		},
		props: {
			activeModal: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				validateCode: '',
				deviceId: '',
				logoutDevice: '',
				processing: '',
				devices: [],

				countDown_phone: 0,
				countDown_email: 0,

				countDown_phone_id: '',
				countDown_email_id: '',

				getCodeError_phone: true,
				getCodeError_email: true,

				codeSent_phone: false,
				codeSent_email: false,

				validateType: 8,

				areaCode: '',
				userMobile: '',
				userEmail: '',
				shortEmail: ''
			}
		},
		computed: {
			btn_getCode_txt() {
				if (this.processing == 'getCode') {
					return this.$t('common.requesting')
				}

				if (this.validateType == 8) {
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
		watch: {
			activeModal(val, oldVal) {
				if (val === 'main') {
					if (this.countDown_phone_id || this.countDown_email_id) {
						clearInterval(this.countDown_phone_id)
						clearInterval(this.countDown_email_id)
						this.countDown_phone = 0
						this.countDown_email = 0
					}

					if (!this.userMobile && !this.userEmail) {
						const secretKey = this.$store.state.User.secretKey
						const phone = this.$store.state.User.accountInfo.userMobile
						if (phone) {
							this.areaCode = this.$store.state.User.accountInfo.areaCode
							if (!isPhone(phone) && !isCnPhone(phone)) {
								this.userMobile = this.$utils.jsencrypt.Aesdencrypt(phone, secretKey)
							} else {
								this.userMobile = phone
							}
						}

						const email = this.$store.state.User.accountInfo.userEmail
						if (email) {
							if (!isEmail(email)) {
								this.userEmail = this.$utils.jsencrypt.Aesdencrypt(email, secretKey)
							} else {
								this.userEmail = email
							}
						}

						this.shortEmail = this.$utils.format.shortEmail(this.userEmail)

						if (this.userMobile) {
							this.validateType = 8
							this.getCodeError_email = true
						} else {
							this.validateType = 9
							this.getCodeError_phone = true
						}
					}
					if (this.devices.length === 0 && oldVal === '') {
						this.getList()
					}
				}
			}
		},
		methods: {
			getDevice(str) {
				const temp = str.split(',')
				if (temp.length <= 1) {
					return str
				} else {
					return this.$t('kickoutDevice.deviceName', { userName: temp[1], deviceName: temp[0] })
				}
			},
			getOrganName(device) {
				let name = device.organName
				if (device.organCode == '000000') {
					name = this.$t('organization.personalEdition')
				}
				return Array.from(name).join('')
			},
			getCode() {
				return new Promise((resolve, reject) => {
					this.processing = 'getCode'
					this.$utils.api.public
						.getCode({
							type: this.validateType,
							areaCode: this.validateType == 8 ? (this.areaCode || '+86') : '',
							account: this.validateType == 8 ? this.userMobile : this.userEmail
						}).get().then((res) => {
							if (this.validateType == 8 && this.getCodeError_phone) {
								this.getCodeError_phone = false
							} else if (this.validateType == 9 && this.getCodeError_email) {
								this.getCodeError_email = false
							}

							const curType = this.validateType
							if (curType == 8) {
								this.countDown_phone = 60
							} else {
								this.countDown_email = 60
							}
							this.processing = ''
							let time = 59
							const countDownId = setInterval(() => {
								if (curType == 8) {
									this.countDown_phone = time
								} else {
									this.countDown_email = time
								}
								time--
								if (time == -1) {
									clearInterval(countDownId)
								}
							}, 1000)

							if (this.validateType == 8) {
								this.countDown_phone_id = countDownId
							} else {
								this.countDown_email_id = countDownId
							}

							resolve({ code: 0 })
						})
						.catch(e => {
							this.processing = ''
							if (this.validateType == 8) {
								this.getCodeError_phone = true
							} else {
								this.getCodeError_email = true
							}
							resolve(e)
						})
				})
			},

			switchType() {
				this.validateCode = ''
				this.validateType = this.validateType == 8 ? 9 : 8
			},
			async preGetCode() {
				if (this.$store.state.codeValidated || (!this.userMobile && !this.userEmail)) {
					this.logOut(false)
				} else {
					await this.getCode()
					this.$emit('modalChange', 'logout')
				}
			},
			preLogout(device) {
				this.logoutDevice = device
				this.$emit('modalChange', 'logoutConfirm')
			},
			logOut(requireCode = true) {
				const validateCode = this.validateCode
				if (requireCode && (!validateCode || validateCode.length !== 6)) {
					if (!validateCode) {
						this.$message.error(this.$t('common.tipCodeEnter'))
						return
					} else if (validateCode.length !== 6) {
						this.$message.error(this.$t('common.tipCodeWrong'))
						return
					}
				}

				this.processing = 'logout'
				this.$utils.api.user
					.kickoutDevice({ id: this.logoutDevice.id, validateType: this.validateType == 8 ? 0 : 1, validateCode })
					.get()
					.then(async res => {
						if (!(this.isCurDevice(this.logoutDevice) && this.logoutDevice.organCode == this.$store.state.User.accountInfo.organCode)) {
							this.$store.commit('codeValidated')
							await this.getList()
							this.processing = ''
							this.$emit('modalChange', 'main')
						}
					}).catch(e => {
						this.processing = ''
						console.log(e)
					})
			},
			isCurDevice(device) {
				if (!this.deviceId) {
					this.deviceId = this.$utils.fun.getGlobalByName('deviceId')
				}
				return device.deviceId == this.deviceId
			},
			getList() {
				return new Promise((resolve, reject) => {
					this.$utils.api.user
						.loginDevices({ queryType: 1, pageSize: 100 })
						.get()
						.then(res => {
							if (res.code == 0) {
								console.log('登录设备：', res)
								this.devices = res.data.list
							}
							resolve()
						}).catch(e => {
							resolve()
						})
				})
			},
			init() {
				window._.assign(this.$data, {
					validateCode: '',
					deviceId: '',
					logoutDevice: {},
					processing: '',
					devices: [],

					countDown_phone: 0,
					countDown_email: 0,

					countDown_phone_id: '',
					countDown_email_id: '',

					getCodeError_phone: true,
					getCodeError_email: true,

					validateType: 8,

					areaCode: '',
					userMobile: '',
					userEmail: '',
					shortEmail: ''
				})
			}
		}
	}
</script>

<style lang="scss">
.login-devices{
	width:470px!important;

	.ant-modal-title{
		padding-right: 20px;
		line-height: 25px;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ant-modal-body {
		padding: 0;
	}

	.desc{
		margin-top: 23px;
		color: #999;
		font-size: 12px;
		padding:0 30px 30px;
	}

	.list{
		height: 460px;
		overflow-y:auto;
		border-bottom: 1px solid #F0F0F0;

		.device{
			pointer-events: none;
			box-sizing: border-box;
			margin-bottom: 32px;
			padding: 0 30px;
			position: relative;

			.device-name,.device-organ,.content{
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.device-model{
				display: flex;
				align-items: center;

				.online-state{
					width:6px;
					height:6px;
					margin-right: 10px;
					border-radius: 50%;
					background:#bcbcbc;
				}

				.content{
					max-width: 300px;
					color:#000;
					font-size: 14px;
				}

				.tag{
					padding: 0 4px;
					line-height: 15px;
					background-color:#bcbcbc;
					border-radius: 2px;
					color:#fff;
					font-size:10px;
					margin-left: 6px;
				}
			}

			.device-name{
				font-size: 12px;
				color: #999;
				margin-top: 6px;
			}

			.device-organ{
				margin-top: 14px;
				font-size: 14px;
				color:#999;
			}

			.iconxiayiye{
				position: absolute;
				right:30px;
				top:12px;
				font-size: 14px;
			}

			&.online{
				pointer-events: unset;
				.online-state{
					background:#61BE26;
				}
				.tag{
					background: #2e87ff;
				}

				&:hover{
					cursor: pointer;
					.iconxiayiye{
						color:#2e87ff;
					}
				}
			}
		}
	}

}

.modal-logout{
	width:390px!important;
	box-sizing: border-box;

	.ant-modal-body {
		padding:25px 24px 20px!important;
	}

	.tip{
		font-size: 14px;
		color:#333;
		margin-bottom:14px!important;
	}
	.code-input{
		display: flex;
		align-items: center;
		justify-content:space-between;
		input{
			width: 250px;
			height: 38px;
			border:solid 1px #e6e6e6;
			text-indent: 10px;
		}
		button{
			width: 79px;
			height: 38px!important;
			padding:0!important;
			border-radius: 4px;
			font-size:12px;
		}
	}

	.type-switch{
		margin: 16px 0;
		color: #2e87ff;
		font-size: 14px;
	}

	.ant-modal-footer{
		border-top:none!important;
	}
}
</style>
