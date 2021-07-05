<template>
	<div>
		<!--选择工作状态弹窗-->
		<a-modal
			:visible="activeModal==='select'"
			class="notification-IM work-status"
			:title="$t('workStatus.title')"
			centered
			:width="432"
			:maskClosable="false"
			:footer="null"
			@cancel="modalChange('')"
			:afterClose="init"
		>
			<div ref="workStatus" class="select">
				<div class="list">
					<a-dropdown
						:getPopupContainer="()=>$refs.workStatus"
						v-for="(status,index) in statuses"
						:key="`status_${status.id}`"
						:trigger="['contextmenu']"
						overlayClassName="right-menu"
					>
						<div :class="{status:true,none:status.id=='',selected:curStatus.id===status.id}" @click="selectStatus(status)">
							<img v-if="status.expression" :src="$utils.message.getEmojiSrc(status.expression)">
							<span>{{status.value}}</span>
							<i class="iconfont icongou"></i>
						</div>

						<a-menu slot="overlay" v-if="!status.isDefault">
							<a-menu-item @click="modalChange('update',status)">
								{{$t('common.edit')}}
							</a-menu-item>
							<a-menu-item @click="delStatus(status.id,index)">
								{{$t('common.delete')}}
							</a-menu-item>
						</a-menu>
					</a-dropdown>
				</div>

				<div class="status add" @click="modalChange('create')">
					<i class="iconfont icontianjia"></i>
					<span>{{$t('workStatus.custom')}}</span>
				</div>

				<a-button class="save" type="primary" :disabled="curStatus.id==originStatus.id||processing" @click="save">
					{{$t('common.save')}}
				</a-button>
			</div>
		</a-modal>

		<!--自定义工作状态弹窗-->
		<a-modal
			:visible="activeModal==='create'||activeModal==='update'"
			class="notification-IM work-status"
			:title="$t('workStatus.title')"
			centered
			:width="432"
			:maskClosable="false"
			:footer="null"
			@cancel="modalChange('select')"
		>
			<div class="create">
				<div class="input-area">
					<textarea maxlength="50" :placeholder="$t('workStatus.input')" :value="customStatusVal" rows="5" @input="inputChange" />
					<div @click.stop="selectingEmoji=true" class="emojis-switch">
						<div class="iconfont icontianjiabiaoqing" v-if="!selectedEmoji"></div>
						<img v-if="selectedEmoji" :src="$utils.message.getEmojiSrc(selectedEmoji)" />
					</div>
				</div>

				<div class="input-tip">
					{{$t('workStatus.inputTip')}}
				</div>
				<a-button class="done" type="primary" :disabled="illegalInput||processing" @click="update">
					{{$t('common.save')}}
				</a-button>

				<div class="emojis" v-show="selectingEmoji" v-clickoutside="hideEmojis">
					<div class="emoji" v-for="(code,index) in codes" :key="index" @click.stop="selectEmoji(code)">
						<img :src="$utils.message.getEmojiSrc(code)" />
					</div>
				</div>
			</div>
		</a-modal>
	</div>
</template>
<script>
	import emojiCodes_zh_CN from '../pages/chat/components/Editor/Emoticons/emojiCodes_zh_CN'
	export default {
		name: 'WorkStatus',
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
				processing: false,
				originStatus: {},
				curStatus: {},
				illegalInput: true,
				customStatusVal: '',
				statuses: [],
				selectingEmoji: false,
				selectedEmoji: '',
				codes: []
			}
		},
		watch: {
			activeModal(val, oldVal) {
				if (oldVal === '' && val === 'select') {
					this.getStatus()
				}
			}
		},
		mounted() {
			this.emojiData = emojiCodes_zh_CN
			this.codes = Object.keys(emojiCodes_zh_CN)
		},
		methods: {
			hideEmojis() {
				this.selectingEmoji = false
			},

			selectEmoji(code) {
				if (this.activeModal == 'update' && this.illegalInput) {
					this.illegalInput = false
				}
				this.selectedEmoji = `[${this.emojiData[code]['zh_CN']}]`
				this.selectingEmoji = false
			},

			update() {
				this.processing = true
				const updatingId = this.activeModal === 'update' ? this.curStatus.id : ''
				this.$utils.api.user.updateWorkStatus({ id: updatingId, isDefault: 0, expression: this.selectedEmoji || '', value: this.customStatusVal }).get().then(async res => {
					console.log(res)
					if (res.code == 0) {
						const status = res.data
						if (updatingId && updatingId == this.originStatus.id) {
							const data = {
								userId: this.$store.state.User.accountInfo.userId,
								workingStatusId: status.id,
								workingStatusValue: status.value,
								workingStatusExpression: status.expression
							}
							await this.$store.dispatch('User/update_info', data)
							await this.$store.dispatch('User/set_accountInfo', data)
							await this.$store.dispatch('Chat/preUpdateThread', { userId: `${this.$store.state.User.accountInfo.userId}` })
						}
						this.curStatus = status
						this.modalChange('select')
					}
					await this.getStatus(true)
					this.illegalInput = true
					this.processing = false
				}).catch(e => {
					console.log(e)
					this.illegalInput = true
					this.processing = false
				})
			},

			delStatus(id, index) {
				this.processing = true
				this.$utils.api.user.delWorkStatus({ userWorkingStatusId: id }).get().then(async res => {
					if (res.code == 0) {
						if (this.originStatus.id == id) {
							this.curStatus = {
								expression: '',
								isDefault: 0,
								value: this.$t('workStatus.none')
							}

							const data = {
								userId: this.$store.state.User.accountInfo.userId,
								workingStatusId: '',
								workingStatusValue: '',
								workingStatusExpression: ''
							}
							await this.$store.dispatch('User/update_info', data)
							await this.$store.dispatch('User/set_accountInfo', data)
							await this.$store.dispatch('Chat/preUpdateThread', { userId: `${this.$store.state.User.accountInfo.userId}` })
						}

						this.$message.success(this.$t('workStatus.deleted'))
					} else if (res.code == '701002') {
						this.$message.error(this.$t('workStatus.deleted'))
						this.curStatus = {
							expression: '',
							isDefault: 0,
							value: this.$t('workStatus.none')
						}
					}
					await this.getStatus()
					this.processing = false
				}).catch(e => {
					console.log(e)
					this.processing = false
				})
			},

			inputChange(e) {
				this.illegalInput = /^[\s|\r|\n]*$/.test(e.target.value)
				this.customStatusVal = e.target.value
			},

			selectStatus(status) {
				this.curStatus = status
			},

			async save() {
				this.processing = true
				try {
					const res = await this.$utils.api.user.setWorkStatus({ userWorkingStatusId: this.curStatus.id }).get()
					if (res.code == 0) {
						const data = {
							userId: this.$store.state.User.accountInfo.userId,
							workingStatusId: this.curStatus.id,
							workingStatusValue: this.curStatus.value,
							workingStatusExpression: this.curStatus.expression
						}
						await this.$store.dispatch('User/update_info', data)
						await this.$store.dispatch('User/set_accountInfo', data)
						await this.$store.dispatch('Chat/preUpdateThread', { userId: `${this.$store.state.User.accountInfo.userId}` })
						this.$message.success(this.$t('workStatus.saved'))
						this.modalChange('')
					} else if (res.code == '701002') {
						this.$message.success(this.$t('workStatus.deleted'))
						this.curStatus = {
							expression: '',
							isDefault: 0,
							value: this.$t('workStatus.none')
						}
						await this.getStatus()
					}
					this.processing = false
				} catch (e) {
					this.processing = false
					console.log(e)
				}
			},

			modalChange(modal, data) {
				if (modal === 'create' && this.statuses.length === 10) {
					this.$message.error(this.$t('workStatus.overCount'))
				} else {
					switch (modal) {
					case 'select':
						this.selectingEmoji = false
						this.selectedEmoji = false
						this.customStatusVal = ''
						this.illegalInput = true
						break
					case 'update':
						this.selectedEmoji = data.expression
						this.customStatusVal = data.value
						this.illegalInput = true
						this.curStatus = data
						break
					}

					this.$emit('modalChange', modal)
				}
			},

			init() {
				if (this.activeModal === 'select') {
					window._.assign(this.$data, {
						processing: false,
						originStatus: {},
						curStatus: {},
						illegalInput: true,
						customStatusVal: '',
						statuses: [],
						selectingEmoji: false,
						selectedEmoji: '',
						codes: []
					})
				}
			},

			getStatus(fromUpdate) {
				return new Promise((resolve, reject) => {
					if (!fromUpdate) {
						const accountInfo = this.$store.state.User.accountInfo
						let originStatus
						if (accountInfo.workingStatusId) {
							originStatus = {
								id: accountInfo.workingStatusId,
								value: accountInfo.workingStatusValue,
								expression: accountInfo.workingStatusExpression
							}
						} else {
							originStatus = {
								id: '',
								expression: '',
								isDefault: 0,
								value: this.$t('workStatus.none')
							}
						}
						this.curStatus = originStatus
						this.originStatus = originStatus
					}

					this.$utils.api.user.getWorkStatus().get().then(res => {
						console.log('工作状态列表：', res)
						if (res.code == 0) {
							this.statuses = [
								...res.data,
								{
									id: '',
									expression: '',
									isDefault: 1,
									value: this.$t('workStatus.none')
								}
							]
						}
						resolve()
					}).catch((e) => {
						console.log(e)
						this.modalChange('')
						resolve()
					})
				})
			}
		}
	}
</script>

<style lang="scss">
 .work-status{
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

	.select{
		padding-bottom: 90px;
		position: relative;
		box-sizing: border-box;

		.list{
			min-height: 240px;
			max-height: 308px;
			overflow-y:auto;
			border-bottom: 1px solid #F0F0F0;
			.status{
				border-bottom: 1px solid #F0F0F0;
			}
			.none{
				border: none;
			}
		}

		.save{
			position: absolute;
			width:61px!important;
			height: 30px!important;
			bottom:30px;
			right: 26px;
		}
	}

	.right-menu {
		min-width: 50px !important;
	}

	.status{
		display: flex;
		align-items: center;
		height: 48px;
		padding:0 35px;
		box-sizing: border-box;
		img{
			width:20px;
			margin-right:20px;
		}
		span{
			flex: 1;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		i{visibility: hidden;color:#208eff;}
		i.icontianjia{
			visibility: visible;
			margin-right: 8px;
		}

		&:hover{
			cursor: pointer;
		}
		&:not(.add):hover,&.selected{
			background: #f4f6f8;
		}
		&.selected i{
			visibility: visible;
		}
	}

	.create{
		position: relative;
		height: 290px;
		padding:21px 26px 0;
		box-sizing: border-box;

		.emojis{
			position: absolute;
			z-index: 1;
			width:260px;
			height: 205px;
			overflow-y: auto;
			overflow-x: hidden;
			background: #fff;
			box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.15);
			border-radius: 4px;
			top: 60px;
			left: 40px;
     		display: flex;
      		flex-wrap: wrap;
			padding: 15px 10px 5px;
			box-sizing: border-box;
      		border: 0;
			.emoji {
				width: 38px;
				height: 38px;
				border-radius: 4px;
				display: flex;
				align-items: center;
				justify-content: center;
				img {
					width: 74%;
					height: 74%;
				}
				&:hover {
					background: rgba(88, 88, 88, 0.2);
				}
			}
		}

		.input-area{
			width:380px;
			box-sizing: border-box;
			padding:16px 16px 16px 40px;
			border-radius: 4px;
			border: solid 1px #e6e6e6;

			textarea{
				resize:none;
				line-height: 20px;
				display: block;
				width:100%;
				word-break: break-all;
				&::-webkit-input-placeholder{
					color: #999999;
				}
			}
			.emojis-switch{
				position: absolute;
				top:38px;
				left:40px;
				color:lightgray;
				background: #fff;
				padding-right: 8px;
				img{width:20px;}
			}
		}

		.input-tip{
			margin-top: 8px;
			text-align: right;
			color: #999999;
		}
		.done{
			position: absolute;
			right:26px;
			bottom:33px;
			width:61px!important;
			height: 30px!important;
		}
	}
}
</style>
