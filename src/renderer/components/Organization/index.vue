<template>
	<div id="organization" v-show="$store.state.organizationPage">
		<div class="title">
			<span class="iconfont iconfanhui" @click="$store.commit('setOrganizationPage', 'index')" v-show="page!=='index'&&page!=='invite'"></span>
			{{pageContent[page].title}}
			<div class="iconfont iconguanbi-1" @click="close"></div>
		</div>
		<div class="invite" v-show="page==='invite'">
			<template v-if="$store.state.User.accountInfo.empAdminFlag">
				<div class="banner">
					<h1>{{$t('organization.threadBannerText[0]')}}</h1>

					<p>{{$t('organization.inviteTip',{projectName:this.$PROJECT_NAME})}}</p>
					<img src="@/assets/img/inviteBanner.png">
				</div>
				<div class="cards">
					<div class="card">
						<h1>{{$t('organization.cardTitle[0]')}}</h1>
						<a-tooltip :visible="activeTooltip==='card1'">
							<template slot="title">
								<p>{{$t('organization.shareTip[1]')}}</p>
							</template>
							<p id="card1" @mouseover="checkOverflow" @mouseleave="activeTooltip=''">
								{{$t('organization.shareTip[1]')}}
							</p>
						</a-tooltip>
						<div class="content-preview">
							{{$t('organization.txtForCopy[0]', { projectName: $PROJECT_NAME, organName: $store.state.User.accountInfo.organName, link: organLink})}}
						</div>
						<div class="btn" @click="copyOrganLink">
							{{$t('common.copy')}}
						</div>
					</div>
					<div class="card">
						<h1>{{$t('organization.cardTitle[1]')}}</h1>
						<a-tooltip :visible="activeTooltip==='card2'">
							<template slot="title">
								<p>{{$t('organization.inviting',{organName:$store.state.User.accountInfo.organName})}}</p>
							</template>
							<p id="card2" @mouseover="checkOverflow" @mouseleave="activeTooltip=''">
								{{$t('organization.inviting',{organName:$store.state.User.accountInfo.organName})}}
							</p>
						</a-tooltip>
						<div class="qrcode">
							<a-spin :spinning="qrcodeLoading" size="large">
								<!--<vue-qr v-if="!qrcodeLoading&&!errorMessage" :size="200" :margin="0" :text="organLink" :callback="qrcodeDrawn"></vue-qr>-->
								<qriously ref="qriously" :value="organLink" :size="160" v-show="!qrcodeLoading&&!errorMessage" />
								<span v-if="!qrcodeLoading&&errorMessage">{{errorMessage}}</span>
							</a-spin>
						</div>
						<a-button class="btn" :loading="savingQrCode" @click="saveQrCode" v-if="!errorMessage">
							{{$t('common.save')}}
						</a-button>
						<a :title="$PROJECT_NAME" :href="inviteCardDataUrl" ref="inviteCardDataUrl" :download="downloadName"></a>
					</div>
					<div class="card">
						<h1>{{$t('organization.code')}}</h1>
						<p>{{$t('organization.shareTip[2]')}}</p>
						<div class="content-preview code">
							{{this.$store.state.User.accountInfo.organCode}}
						</div>
						<div class="btn" @click="copyOrganCode">
							{{$t('common.copy')}}
						</div>
					</div>
					<div class="text1">
						{{$t('organization.validity[1]')}}
					</div>
				</div>
				<canvas id="inviteCard" ref="inviteCard"></canvas>
			</template>
			<template v-else>
				<div class="no-invite-right">
					<img src="@/assets/img/noInviteRight.png">
					<div>{{$t('organization.noInviteRight')}}</div>
				</div>
			</template>
		</div>

		<div class="page" v-show="page!=='invite'">
			<img class="banner-left" src="@/assets/img/organization.png">

			<div class="entrances" v-show="page==='index'">
				<div class="entrance" @click="$store.commit('setOrganizationPage', 'join')">
					<div><span style="color: #2e87ff;">{{$t('organization.join')}}</span>{{$t('organization.newOrgan')}}</div>
					<p>{{$t('organization.joinTip', {projectName: $PROJECT_NAME})}}</p>
					<span class="iconfont iconxiayiye"></span>
				</div>
				<div class="entrance" v-if="$store.state.Setting.paramsConfig&&$store.state.Setting.paramsConfig.allowCreateEnterp" @click="$store.commit('setOrganizationPage', 'create')">
					<div><span style="color: #ff9000;">{{$t('organization.create')}}</span>{{$t('organization.newOrgan')}}</div>
					<p>{{$t('organization.createTip')}}</p>
					<span class="iconfont iconxiayiye"></span>
				</div>
			</div>

			<div class="others" v-show="page!=='index'">
				<div class="sub-title" v-show="pageContent[page].subTitle">
					{{pageContent[page].subTitle}}
				</div>
				<div class="tip" v-show="pageContent[page].tip">
					{{pageContent[page].tip}}
				</div>

				<input :placeholder="$t('organization.inputTip_code')" maxlength="6" v-show="page==='join'" :value="inputValue" @input="inputChange">
				<a-button v-show="page=='join'" type="primary" :disabled="illegalInput||prosessing" @click="join">
					{{$t('common.next')}}
				</a-button>

				<input :placeholder="$t('organization.inputTip_name')" maxlength="50" v-show="page==='create'" :value="inputValue" @input="inputChange">
				<a-button v-show="page=='create'" type="primary" :disabled="illegalInput||prosessing" @click="create">
					{{$t('organization.createAndSwitch')}}
				</a-button>

				<!-- 申请加入企业是否需要审核开关 -->
				<div class="verify-switch" v-show="page=='preInvite'">
					<h1 class="verify-switch-title">
						{{$t('organization.verifySwitch[0]')}}
					</h1>
					<p class="verify-switch-desc">
						{{$t('organization.verifySwitch[1]')}}
					</p>
					<a-switch :disabled="prosessing" :checked="verifySwitchChecked" @click="switchVertify" />
				</div>

				<a-button class="btn-invite" v-show="page=='preInvite'" type="primary" @click="$store.commit('setOrganizationPage', 'invite')">
					{{$t('organization.addMember')}}
				</a-button>
				<div v-show="page=='preInvite'" class="invite-later" @click="close">
					{{$t('organization.addLatter')}}
				</div>
			</div>
		</div>

		<!--切换企业确认框-->
		<a-modal
			class="notification-IM"
			centered
			:width="436"
			:maskClosable="false"
			:title="$t('organization.join')+$t('organization.newOrgan')"
			:visible="switchingOrgan!==null"
			@cancel="switchingOrgan=null"
		>
			<p v-if="switchingOrgan&&!switchingOrgan.exits">
				{{$t('organization.preJoin', { name: switchingOrgan?switchingOrgan.organName:''})}}
			</p>
			<p v-if="switchingOrgan&&switchingOrgan.exits">
				{{$t('organization.joined')}}
			</p>

			<template #footer>
				<a-button type="primary" @click="switchOrgan">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button @click="switchingOrgan=null">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>
	</div>
</template>

<script>
	const projectLogo = require(`@/assets/img/${process.env.PROJECT_NAME}/logo@2x.png`)
	export default {
		name: 'Organization',
		props: {
			parent: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				verifySwitchChecked: false,
				activeTooltip: '',
				isOverflow: {},
				downloadName: '',
				inviteCardDataUrl: '',
				qrcodeDataUrl: '', // 二维码图片数据
				savingQrCode: false,
				switchingOrgan: null,
				organLink: '',
				qrcodeLoading: true,
				errorMessage: '',
				inputValue: '',
				illegalInput: true,
				prosessing: false,
				pageContent: {
					'': {
						title: ''
					},
					'index': {
						title: this.$t('organization.join_or_create')
					},
					'invite': {
						title: this.$t('organization.inviteFriends')
					},
					'join': {
						title: `${this.$t('organization.joinNew')}`,
						subTitle: this.$t('organization.inputTip_code'),
						tip: this.$t('organization.aboutCode')
					},
					'create': {
						title: `${this.$t('organization.createNew')}`,
						subTitle: this.$t('organization.inputTip_complete'),
						tip: this.$t('organization.aboutName')
					},
					'preInvite': {
						title: `${this.$t('organization.createNew')}`,
						subTitle: this.$t('organization.addOrganMember')
					}
				}
			}
		},
		computed: {
			page() {
				return this.$store.state.organizationPage
			}
		},
		watch: {
			'$store.state.Setting.lang'(val) {
				this.pageContent = {
					'': {
						title: ''
					},
					'index': {
						title: this.$t('organization.join_or_create')
					},
					'invite': {
						title: this.$t('organization.inviteFriends')
					},
					'join': {
						title: `${this.$t('organization.joinNew')}`,
						subTitle: this.$t('organization.inputTip_code'),
						tip: this.$t('organization.aboutCode')
					},
					'create': {
						title: `${this.$t('organization.createNew')}`,
						subTitle: this.$t('organization.inputTip_complete'),
						tip: this.$t('organization.aboutName')
					},
					'preInvite': {
						title: `${this.$t('organization.createNew')}`,
						subTitle: this.$t('organization.addOrganMember'),
						tip: ''
					}
				}
			},
			'$store.state.organizationPage': {
				handler(val) {
					if (val === 'invite') {
						this.$utils.api.user.getOrganQrCodeLink().get().then(res => {
							this.organLink = res.data.url
							this.qrcodeLoading = false
						}).catch(e => {
							this.errorMessage = e.message
							this.qrcodeLoading = false
						})
					/* this.$utils.api.user.getOrganQrCode().get().then(res => {
						const secretKey = this.$utils.jsencrypt.RSAdencrypt(this.$store.state.User.accountInfo.secretKey)
						let qrCodeInfo = this.$utils.jsencrypt.Aesdencrypt(res.data.uuid, secretKey)
						try {
							qrCodeInfo = JSON.parse(qrCodeInfo)
						} catch (e) {
						}
						this.$utils.api.thirdpart.getServerTime().get().then(response => {
							qrCodeInfo.content += `:${response.data.timestamp}`
							const qrCode = this.$utils.jsencrypt.Aesencrypt(JSON.stringify(qrCodeInfo), secretKey)
							this.organLink = qrCode
							this.qrcodeLoading = false
						})
					}).catch(e => {
						this.errorMessage = e.message
						this.qrcodeLoading = false
					}) */
					} else if (val === 'preInvite' && !this.pageContent['preInvite'].tip) {
						this.pageContent['preInvite'].tip = this.$t('organization.preInviteTip', { organName: this.$store.state.User.accountInfo.organName, projectName: this.$PROJECT_NAME })
					}

					this.verifySwitchChecked = false
					this.activeTooltip = ''
					this.isOverflow = {}
					this.qrcodeDataUrl = ''
					this.savingQrCode = false
					this.qrcodeLoading = true
					this.organLink = ''
					this.errorMessage = ''

					this.inputValue = ''
					this.illegalInput = true
					this.prosessing = false
					this.switchingOrgan = null
				},
				immediate: true
			}
		},
		methods: {
			async switchVertify() {
				this.prosessing = true
				this.$utils.api.user.updateOrgNeedAudit({ organId: this.$store.state.User.accountInfo.organId, needAudit: this.verifySwitchChecked ? 0 : 1 }).get().then(res => {
					if (res.code == 0) {
						this.verifySwitchChecked = !this.verifySwitchChecked
					}
					this.prosessing = false
				}).catch(e => {
					console.log(e)
					this.prosessing = false
				})
			},
			checkOverflow(e) {
				const id = e.target.id
				if (this.isOverflow[id] !== undefined) {
					this.activeTooltip = this.isOverflow[id] ? id : ''
					return
				}
				const containerHeight = e.target.clientHeight
				const wordsHeight = e.target.scrollHeight
				if (containerHeight < wordsHeight) {
					this.isOverflow[id] = true
					this.activeTooltip = id
				} else {
					this.isOverflow[id] = false
				}
			},
			qrcodeDrawn(dataUrl) {
				this.qrcodeDataUrl = dataUrl
			},
			getOrganFirst(organName) {
				return Array.from(organName)[0]
			},
			async saveQrCode() {
				if (this.savingQrCode) return
				this.savingQrCode = true
				const inviteCard = new Image()
				inviteCard.src = this.$refs.qriously.$refs.qrcode.toDataURL()

				inviteCard.onload = () => {
					// 根据设备像素比缩放图像，防止模糊
					const ratio = window.devicePixelRatio / 2
					const canvasWidth = 750 * ratio
					const canvasHeight = 1257 * ratio
					const scaleRate = 0.5 / ratio
					const canvas = this.$refs.inviteCard
					canvas.style.width = `${canvasWidth * scaleRate}px`
					canvas.style.height = `${canvasHeight * scaleRate}px`
					canvas.width = canvasWidth
					canvas.height = canvasHeight

					const ctx = canvas.getContext('2d')
					ctx.fillStyle = '#f9f9f9'
					ctx.fillRect(0, 0, canvasWidth, canvasHeight)

					// 绘制应用LOGO
					const logo = new Image()
					logo.src = projectLogo
					logo.onload = () => {
						ctx.drawImage(logo, 254 * ratio, 98 * ratio, 51 * ratio, 51 * ratio)

						// 绘制应用名称
						ctx.save()
						ctx.fillStyle = '#333'
						ctx.font = `${38 * ratio}px PingFangSC-Medium`
						ctx.textBaseline = 'middle'
						ctx.fillText(`${this.$PROJECT_NAME}`, 320 * ratio, 128 * ratio)
						ctx.restore()

						// 绘制下载提示
						ctx.save()
						ctx.fillStyle = '#333'
						ctx.font = `${24 * ratio}px PingFangSC-Regular`
						ctx.textBaseline = 'top'
						ctx.textAlign = 'center'
						ctx.fillText(this.$t('organization.downloadTip', { projectName: this.$PROJECT_NAME }), canvasWidth / 2, 186 * ratio)
						ctx.restore()

						// 绘制二维码区域
						this.$utils.canvas.fillRoundRect(ctx, 46 * ratio, 263 * ratio, 660 * ratio, 752 * ratio, 12 * ratio, '#fff')

						// 绘制头像背景
						ctx.beginPath()
						ctx.arc(146 * ratio, 385 * ratio, 48 * ratio, 0, 2 * Math.PI)
						ctx.fillStyle = '#4d80bf'
						ctx.fill()

						// 绘制头像文字
						ctx.save()
						const organName = this.$store.state.User.accountInfo.organName
						ctx.fillStyle = '#fff'
						ctx.font = `${42 * ratio}px PingFangSC-Regular`
						ctx.textAlign = 'center'
						ctx.textBaseline = 'middle'
						ctx.fillText(Array.from(organName)[0], 146 * ratio, 385 * ratio)
						ctx.restore()

						// 绘制企业名称
						ctx.save()
						ctx.fillStyle = '#181818'
						ctx.font = `${36 * ratio}px PingFangSC-Regular`
						ctx.textBaseline = 'top'
						ctx.fillText(this.$utils.canvas.contentCut(organName, ctx, 11, 455 * ratio, 40 * ratio), 216 * ratio, 349 * ratio)
						ctx.restore()

						// 绘制企业代码
						ctx.save()
						ctx.fillStyle = '#999'
						ctx.font = `${28 * ratio}px PingFangSC-Regular`
						ctx.textBaseline = 'top'
						ctx.fillText(`${this.$t('organization.code')}：${this.$store.state.User.accountInfo.organCode}`, 216 * ratio, 398 * ratio)
						ctx.restore()

						// 绘制二维码
						ctx.drawImage(inviteCard, 172 * ratio, 473 * ratio, 408 * ratio, 408 * ratio)

						// 绘制有效期提示
						ctx.save()
						ctx.font = `${26 * ratio}px PingFangSC-Regular`
						ctx.fillStyle = '#666'
						ctx.textAlign = 'center'
						ctx.fillText(this.$t('organization.validity[0]'), canvasWidth / 2, 940 * ratio)
						ctx.restore()

						// 绘制底部提示
						ctx.save()
						ctx.font = `${24 * ratio}px PingFangSC-Regular`
						ctx.fillStyle = '#333'
						ctx.textAlign = 'center'
						const breakWords = this.$utils.canvas.contentBreak(this.$t('organization.scanTip', { projectName: this.$PROJECT_NAME }), ctx, 25, 650 * ratio, 26 * ratio)
						const lineHeight = 45 * ratio
						for (let i = 0; i < breakWords.length; i++) {
							ctx.fillText(breakWords[i], canvasWidth / 2, 1090 * ratio + lineHeight * i)
						}
						ctx.restore()

						// 将图片保存到本地
						const inviteCardDataUrl = canvas.toDataURL()
						this.inviteCardDataUrl = inviteCardDataUrl
						this.downloadName = this.$utils.time.formatTimestamp(new Date().getTime(), 'YMD-hms') + '.png'
						this.$nextTick(() => {
							this.$refs.inviteCardDataUrl.click()
							this.savingQrCode = false
						})

						// 图片名称
						// const fileName = `${this.$utils.time.formatTimestamp(new Date().getTime(), 'YMD-hms')}.png`
						/* const imgDataBuffer = inviteCardDataUrl.replace(/^data:image\/\w+;base64,/i, '')
						this.$utils.fun.saveImage({
							fileName,
							data: Buffer.alloc(imgDataBuffer.length, imgDataBuffer, 'base64')
						}).then(res => {
							if (res.state == 'success') {
								this.$message.success(this.$t('common.saveStatus[0]'))
							} else {
								console.log(res)
							}
							this.savingQrCode = false
						}).catch(e => {
							console.log(e)
							this.savingQrCode = false
						})*/
					}
				}
			},
			copyOrganLink() {
				this.$utils.fun.writeToClipboard({ text: this.$t('organization.txtForCopy[0]', { projectName: this.$PROJECT_NAME, organName: this.$store.state.User.accountInfo.organName, link: this.organLink }) })
				this.$message.success(this.$t('organization.copyCode'))
			},
			copyOrganCode() {
				this.$utils.fun.writeToClipboard({ text: this.$t('organization.txtForCopy[1]', { projectName: this.$PROJECT_NAME, organName: this.$store.state.User.accountInfo.organName, link: this.organLink, code: this.$store.state.User.accountInfo.organCode }) })
				this.$message.success(this.$t('organization.copyCode'))
			},
			close() {
				this.$store.commit('setOrganizationPage', '')
			},
			inputChange(e) {
				let value = e.target.value
				if (this.page === 'join') {
					this.illegalInput = !/^\d{6}$/.test(value)
				} else if (this.page === 'create') {
					value = value.trim()
					this.illegalInput = value.length === 0
				}
				this.inputValue = value
			},
			create() {
				this.prosessing = true
				this.$utils.api.user.createOrgan({ organName: this.inputValue }).get().then(res => {
					this.pageContent['preInvite'].tip = this.$t('organization.preInviteTip', { organName: res.data.organName, projectName: this.$PROJECT_NAME })
					if (this.parent !== 'login') {
						this.$store.dispatch('Setting/set_pageLoading', { content: this.$t('common.loading') + '...', translucent: true })
						this.$store.commit('setOrganizationPage', 'preInvite')
					} else {
						this.$store.dispatch('Setting/set_pageLoading', this.$t('common.loading') + '...')
					}
					this.$emit('createdOrgan', res.data)
					this.prosessing = false
				}).catch(e => {
					console.log(e)
					this.prosessing = false
				})
			},
			join() {
				if (this.inputValue == this.$store.state.User.accountInfo.organCode) {
					this.switchingOrgan = {
						exits: true
					}
					return
				}
				this.prosessing = true
				this.$utils.api.user.checkOrgan({ organCode: this.inputValue }).get().then(res => {
					if (res.code == 0) {
						this.switchingOrgan = res.data
					}
					this.prosessing = false
				}).catch(e => {
					console.log(e)
					this.prosessing = false
				})
			},
			switchOrgan() {
				if (this.switchingOrgan.exits && !this.switchingOrgan.organId) {
					if (this.parent !== 'login') {
						this.$router.push({ path: '/chat', replace: true })
					}
					this.close()
				} else {
					this.$emit('switchOrgan', this.switchingOrgan)
					this.switchingOrgan = null
				}
			}
		}
	}
</script>

<style lang="scss">
	#organization{
		position: absolute;
		top:0;
		left: 0;
		width: 100%;
		height: 100%;
		padding:80px 80px 0;
		z-index: 99998;
		box-sizing: border-box;
		background: #fff;
		-webkit-app-region: drag;
		.save-qrcode{
			top: 0;
			left: 187px;
			width: 338px;
			height: 435px;
			position: absolute;
			display: flex;
			background-color: #ffffff;
			align-items: center;
			flex-direction: column;
			justify-content: center;
			z-index: 3;
			.organ-header{
				width: 63px;
				height: 64px;
				background-color: #4d80bf;
				border-radius: 50%;
				align-items: center;
				justify-content: center;
				display: flex;
				color: #fff;
				font-size: 33px;
			}
			.text2{
				margin-top: 10px;
				font-size: 12px;
				color: #999;
				text-align:center;
			}
			.organ-name{
				font-size: 19px;
				color: #333;
				border-bottom: 1px solid #e6e6e6;
				width: 80%;
				text-align: center;
				white-space: nowrap;
				text-overflow: ellipsis;
				overflow: hidden;
				word-break: break-all;
				height: 70px;
				line-height: 70px;
				margin-bottom: 10px;
			}
		}
		.title{
			font-size: 20px;
			line-height: 20px;
			letter-spacing: 0px;
			color: #333333;
			position: relative;
			z-index: 2;
			.iconfanhui{
				padding-right:8px;
				font-weight: bold;
				color:#000000;
			}

			.iconguanbi-1{
				float:right;
			}

			.iconfont{
				cursor: pointer;
				&:hover{
					color:#2e87ff;
				}
			}
		}

		.invite{
			width:766px;
			height: 420px;
			position: absolute;
			top:21%;
			left:50%;
			margin-left: -383px;
			z-index: 2;

			.no-invite-right{
				width:100%;
				height:100%;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				img{
					width:146px;
					margin-bottom: 18px;
				}
				div{
					color:#999;
					font-size: 14px;
				}
			}

			#inviteCard{
				position: absolute;
				visibility: hidden;
			}

			.banner{
				position: relative;
				width:100%;
				height: 132px;
				background-color: #5a99ee;
				border-radius: 4px;
				color:#fff;
				padding: 28px 26px;
				box-sizing: border-box;
				h1{
					color:#fff;
					font-size: 22px;
				}
				p{
					font-size: 14px;
				}
				img{
					position:absolute;
					right:26px;
					top:0;
					width:232px;
					height:100%;
				}
			}

			.cards{
				margin-top: 13px;
				width:100%;
				display: flex;
				align-items: center;
				justify-content:space-between;
				position:relative;
				.card{
					position: relative;
					width: 248px;
					height: 290px;
					border: solid 1px #e6e6e6;
					box-sizing: border-box;
					padding:22px 16px;
					border-radius: 8px;
					h1{
						font-size: 16px;
						color:#333;
						margin-bottom: 10px;
					}
					p{
						display: -webkit-box;
						font-size: 14px;
						color:#999;
						overflow: hidden;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 2;
						word-break:break-word;
						margin-bottom:8px;
					}
					.content-preview{
						margin:0 auto;
						padding:0 14px;
						border-top: 13px solid #f6f7f8;
						border-bottom: 12px solid #f6f7f8;
						width: 216px;
						box-sizing: border-box;
						height: 125px;
						background-color: #f6f7f8;
						border-radius: 4px;
						font-size: 14px;
						color: #999;
						word-break: break-word;
						overflow-y: auto;
						cursor: text;
						user-select:text;
						&::-webkit-scrollbar {
							width:3px;
							color:#D8D8D9;
							background: #f6f7f8;
						}
						&.code{
							font-family: 'PingFangSC-Medium';
							font-size: 24px;
							font-weight: normal;
							font-stretch: normal;
							letter-spacing: 10px;
							color: #333333;
							text-align: center;
							border:none;
							padding:0;
							line-height: 125px;
						}
					}

					.qrcode{
						margin:13px auto 0;
						display: flex;
						align-items: center;
						justify-content: center;
						height: 125px;
						img{
							width: 108px;
							height: 108px;
						}
					}

					.btn{
						position:absolute;
						bottom:20px;
						left:50%;
						margin-left: -40px;
						width: 80px;
						height: 30px;
						border-radius: 4px;
						border: solid 1px #2e87ff;
						color: #2e87ff;
						font-size: 14px;
						display: flex;
						align-items: center;
						justify-content: center;
						cursor: pointer;
					}

				}
				.text1{
					position:absolute;
					width: 100%;
					bottom: -22px;
					left: 0;
					color: #999;
					line-height: 12px;
					font-size: 12px;
					text-align: center;
				}
			}
		}

		.page{
			width:760px;
			height: 280px;
			display: flex;
			align-items: center;
			justify-content:space-between;
			position: absolute;
			top:25%;
			left:50%;
			margin-left: -380px;

			.banner-left{
				width:313px;
			}

			.entrances{
				display: flex;
				align-items: flex-end;
				flex-direction: column;
				.entrance{
					position: relative;
					width:412px;
					height: 98px;
					cursor: pointer;
					border-radius: 4px;
					box-shadow: 2px 4px 12px 0px rgba(177, 177, 177, 0.36);
					padding: 15px 50px 0 23px;
					box-sizing: border-box;
					margin-top: 20px;
					&:hover{
						border: solid 1px #2e87ff;
					}
					div{
						font-family: PingFangSC-Medium;
						font-size: 16px;
					}
					p{
						margin-top: 6px;
						font-family: PingFangSC-Regular;
						font-size: 12px;
						line-height: 18px;
						color: #666666;
					}
					.iconxiayiye{
						position: absolute;
						right:24px;
						top:44px;
						font-size: 12px;
					}
				}
			}

			.others{
				position: relative;
				width:320px;
				.sub-title{
					font-family: PingFangSC-Semibold;
					font-size: 22px;
					font-weight: normal;
					font-stretch: normal;
					letter-spacing: 0px;
					color: #333333;
				}
				.tip{
					font-family: PingFangSC-Regular;
					font-size: 14px;
					font-weight: normal;
					font-stretch: normal;
					letter-spacing: 0px;
					color: #666666;
					margin-top: 8px;
				}
				input{
					width:100%;
					line-height: 36px;
					margin-top: 10px;
					border:none;
					border-bottom: 1px solid #e6e6e6;
				}

				input::-webkit-outer-spin-button,
				input::-webkit-inner-spin-button {
					-webkit-appearance: none;
				}

				input::-webkit-input-placeholder{
					color:#999;
				}

				.verify-switch{
					position:relative;
					margin-top:26px;
					width: 320px;
					border-radius: 6px;
					border: solid 1px #f0f0f0;
					box-sizing: border-box;
					padding:14px 17px 18px;
					.verify-switch-title{
						font-size: 16px;
						color: #333;
						margin-bottom:10px;
					}
					.verify-switch-desc{
						font-size: 12px;
						color:#999;
						margin:0;
					}
					.ant-switch{
						position:absolute;
						top:16px;
						right:15px;
						width:44px!important;
						height:22px!important;
					}

				}

				button:not(.ant-switch){
					display: block;
					cursor: pointer;
					width:100%;
					height: 36px;
					border-radius: 4px;
					margin-top: 46px;
				}

				.btn-invite{
					margin-top: 38px;
				}

				.invite-later{
					font-size: 14px;
					color: #2e87ff;
					text-align: center;
					position: absolute;
					bottom:-40px;
					right:0;
					width:100%;
					cursor: pointer;
				}
			}
		}

	}
</style>

