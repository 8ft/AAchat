<template>
	<div ref="qrcodecard">
		<a-modal class="qrcode-card" :getContainer="()=>$refs.qrcodecard" :visible="visible" :width="376" :closable="false"
			:afterClose="afterClose" @cancel.stop="cancel"
		>
			<a-avatar class="avatar" :size="64" :loadError="avatarError" :src="userAvatar" alt="头像丢失" />
			<h1 class="nickName">
				{{data.name}}
			</h1>
			<div class="qrcode">
				<a-spin :spinning="qrcodeLoading" size="large">
					<qriously :value="qrcode" :size="195" v-show="!qrcodeLoading" />
					<span v-if="errorMessage">{{errorMessage}}</span>
				</a-spin>
			</div>
			<div class="tip">
				{{$t('userCard.qrValidTip')}}
			</div>
		</a-modal>
	</div>
</template>

<script>
	import qun from '@/assets/img/qun_default@2x.png'
	import geren from '@/assets/img/geren_default@2x.png'

	export default {
		name: 'Qrcode',
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			data: {
				type: Object,
				default: () => {
					return {}
				}
			}
		},
		data() {
			return {
				userAvatar: this.data.avatar,
				qrcodeLoading: true,
				qrcode: '',
				getGroupQrCode: null,
				errorMessage: '',
				expire: window.$moment().add(7, 'days').format('M月D日')
			}
		},
		watch: {
			visible() {
				if (this.visible) {
					this.userAvatar = this.data.avatar
					this.qrcodeLoading = true
					this.getGroupQrCode = this.$utils.api.user.getGroupQrCode()
					this.getGroupQrCode.get({ groupId: this.data.id }).then(res => {
						const secretKey = this.$utils.jsencrypt.RSAdencrypt(this.$store.state.User.accountInfo.secretKey)
						let qrCodeInfo = this.$utils.jsencrypt.Aesdencrypt(res.data.qrCode, secretKey)
						try {
							qrCodeInfo = JSON.parse(qrCodeInfo)
						} catch (e) {
						}
						qrCodeInfo.content += `:${new Date().getTime()}`
						const qrCode = this.$utils.jsencrypt.Aesencrypt(JSON.stringify(qrCodeInfo), secretKey)
						this.qrcode = qrCode
						this.qrcodeLoading = false
					}).catch(e => {
						this.errorMessage = e.message
						this.qrcodeLoading = false
					})
				}
			}
		},
		methods: {
			afterClose() {
				this.errorMessage = ''
				this.qrcode = ''
				if (this.getGroupQrCode) this.getGroupQrCode.abort()
			},
			cancel() {
				this.$emit('update:visible', false)
			},
			avatarError() {
				switch (this.data.type) {
				case 0:
				case 2:
					this.userAvatar = geren
					break
				case 1:
					this.userAvatar = qun
					break
				}
			}
		}
	}
</script>

<style lang="scss">
  .qrcode-card {
    .ant-modal-content {
      .avatar {
        display: block;
        margin: 30px auto 0;
      }
      .nickName {
        font-size: 24px;
        color: #333;
        font-weight: normal;
        text-align: center;
        margin-top: 14px;
      }
      .qrcode {
        width: 195px;
        height: 195px;
        margin: 20px auto 38px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tip {
        color: #999;
        font-size: 12px;
        text-align: center;
        margin: 0 0 38px;
      }
      .ant-modal-footer {
        display: none;
      }
    }
  }
</style>
