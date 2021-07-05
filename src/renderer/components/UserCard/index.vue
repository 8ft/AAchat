<!--/**
* creater: chenrenbin
* creatTime: 2019.07.24
* use: <UserCard
		 :firstModal=""     // 首屏
		 :privacyProtection //是否开启保护
*        :userId=""         // 展示用户的userId
*        :comfirm=""        //  底部按钮回调方法（会返回用户信息参数，以供外部所需）
*        :comfirmText=""    //  回调按钮显示文本
*        :cancel=""         //  关闭组件
*        :way=""            //  搜索的查找方式&#45;&#45;用于添加好友功能
*      />
*
*  ps: 不传入回调方法时，底部按钮不显示;
*      基于业务：好友可以修改备注；自己可以修改昵称和头像；底部按钮功能会优先使用外部传入的回调，未传入则根据与当前账号的关系去自定义
**/-->
<template>
	<div class="user-card-main" ref="userCard">
		<a-modal class="user-card" centered :getContainer="()=>$refs.userCard" :afterClose="afterClose"
			:visible="!!userId && visible == 'userCard'" :width="338" :closable="false" @cancel.stop="cancel"
		>
			<a-spin :spinning="spinning" :wrapperClassName="'spinning'">
				<div class="header">
					<div class="name">
						<p v-if="!nameEditabled">
							{{data.nickName}}<i class="iconfont iconbeizhu" @click="initEditName" v-if="data.relationState == 3"></i>
						</p>
						<a-input ref="nickNameInp" :placeholder="$t('login.setNickname')" maxlength="20" v-model.trim="newNickName"
							@pressEnter="handleEditName" @blur="handleEditName" v-else
						/>
						<a-tooltip placement="bottom" :title="$t('common.sendThisCard')">
							<i class="iconfont opt iconfasongmingpian" @click="showModal('sendCard')"
								v-if="(data.relationState==1&&data.isOnBlacklist!=1)||data.relationState==3"
							></i>
						</a-tooltip>
						<!-- <a-tooltip placement="bottom" title="语音通话">
							<i class="iconfont opt icondianhua2" @click="sendAudio"
								v-if="data.relationState == 1"
							></i>
						</a-tooltip> -->
						<a-tooltip placement="bottom" :title="$t('common.deleteFriends')">
							<i class="iconfont opt iconjiechuhaoyou" @click="showModal('deleteUser')"
								v-if="data.relationState==1&&data.isOnBlacklist!=1"
							></i>
						</a-tooltip>
					</div>
					<a-avatar id="usercardAvatar" class="avtor" :class="{edit: data.relationState == 3, backgroundColorWhite: data.code === 1}" @click="initEditAvator" :size="64"
						:loadError="avatarError" :src="data.userAvatar" alt="头像丢失"
					></a-avatar>
				</div>
				<div class="main">
					<div class="work-status" v-if="data.workingStatusId">
						<img v-if="data.workingStatusExpression" :src="$utils.message.getEmojiSrc(data.workingStatusExpression)">
						<span>{{data.workingStatusValue}}</span>
					</div>
					<h3>{{$t('userCard.personalInfo')}}</h3>
					<div class="item" v-if="data.nickName">
						<div class="label">
							{{$t('userCard.nickname')}}
						</div>
						<div class="value">
							<p>{{data.nickName}}</p>
						</div>
					</div>
					<div class="item" v-if="!privacyProtection">
						<div class="label">
							{{'ID'}}
						</div>
						<div class="value">
							<template	v-if="data.idEditable==1&&data.relationState==3">
								<p v-if="!accountCodeEditabled">
									{{data.accountCode}}
									<a-tooltip placement="right" :title="$t('common.modify') + `${' ID'}`">
										<i class="iconfont iconbeizhu" @click="initEditAccountCode"></i>
									</a-tooltip>
								</p>
								<a-input ref="accountCodeInp" maxlength="20" v-model.trim="newAccountCode"
									@pressEnter="_checkAccountCode" @blur="_checkAccountCode" v-else
								/>
							</template>
							<p v-else>
								{{data.accountCode}}
							</p>
						</div>
					</div>
					<p class="tip"	v-if="accountCodeEditabled">
						{{$t('userCard.changeIdTip')}}
					</p>
					<!--relationState: 0-未加为好友 1-已加为好友 2-待同意 3-自己本人 -->
					<div class="item" v-if="data.relationState == 1">
						<div class="label">
							{{$t('userCard.alias')}}
						</div>
						<div class="value">
							<p v-if="!labelEditabled">
								{{data.label}}
								<a-tooltip placement="right" :title="$t('userCard.addAlias')">
									<i class="iconfont iconbeizhu" @click="initEditLabel"></i>
								</a-tooltip>
							</p>
							<a-input ref="labelInp" :placeholder="$t('userCard.enterAlias')" maxlength="20" v-model.trim="newLabel"
								@pressEnter="handleEditLabel" @blur="handleEditLabel" v-else
							/>
						</div>
					</div>

					<div class="item" v-if="data.relationState == 3">
						<div class="label">
							{{$t('common.sex[0]')}}
						</div>
						<div class="value" v-clickoutside="cancelEditSex" ref="sex_select">
							<p v-show="!edit_sex">
								{{mySex}}
								<i id="editMyInfo_sex" class="iconfont iconbeizhu" @click="edit_sex=true"></i>
							</p>
							<a-select
								v-show="edit_sex"
								:getPopupContainer="()=>$refs.sex_select"
								:default-value="mySex"
								style="width: 172px"
								@change="editMyInfo"
							>
								<a-select-option value="1">
									{{$t('common.sex[1]')}}
								</a-select-option>
								<a-select-option value="0">
									{{$t('common.sex[2]')}}
								</a-select-option>
							</a-select>
						</div>
					</div>

					<div class="item" v-if="data.relationState == 3">
						<div class="label">
							{{$t('common.birthday')}}
						</div>
						<div class="value" ref="datePicker_birthday" v-clickoutside="cancelEditBirthday">
							<p v-show="!edit_birthday">
								{{$store.state.User.accountInfo.birthday||$t('common.sex[3]')}}
								<i id="editMyInfo_birthday" class="iconfont iconbeizhu" @click="edit_birthday=true"></i>
							</p>
							<a-date-picker
								:locale="locale"
								:allowClear="false"
								v-show="edit_birthday"
								:showToday="false"
								:default-value="myBirthday"
								:inputReadOnly="true"
								:getCalendarContainer="()=>$refs.datePicker_birthday"
								:disabled-date="disabledDate"
								@change="editMyInfo"
							>
							</a-date-picker>
						</div>
					</div>

					<!--1.3版本去除分组-->
					<!--<div class="item" v-if="data.relationState == 1 || data.relationState == 3">-->
					<!--<div class="label">{{$t('userCard.groups')}}</div>-->
					<!--<div class="value">-->
					<!--<p v-if="!groupEditabled">{{data.friendGroupName}}-->
					<!--<a-tooltip placement="right" :title="$t('userCard.setGroups')">-->
					<!--<i class="iconfont iconxiangxia" @click="initEditGroup"></i>-->
					<!--</a-tooltip>-->
					<!--</p>-->
					<!--<a-select ref="groupSelect" :placeholder="$t('comon.tipSelectEnter')" :defaultOpen="true" :defaultActiveFirstOption="false" style="width:178px;" v-model="data.friendGroupId" @change="handleEditGroup" v-else>-->
					<!--<a-select-option-->
					<!--:value="item.friendGroupId"-->
					<!--:disabled="data.friendGroupId == item.friendGroupId"-->
					<!--v-for="(item, index) in friendGroups"-->
					<!--:key="`group${index}`">-->
					<!--{{item.friendGroupName}}-->
					<!--</a-select-option>-->
					<!--</a-select>-->
					<!--</div>-->
					<!--</div>-->
				</div>
			</a-spin>

			<div class="avatar-previewer" v-show="previewAvatar" v-clickoutside="switchAvatarPreviewer">
				<img :src="data.userAvatar">
			</div>

			<!--暂时以userId定义用户自己的按钮默认为发送消息-->
			<template v-slot:footer>
				<a-button class="operation" type="primary" :loading="loading" :disabled="spinning" @click="comfirm(data)"
					v-if="comfirm"
				>
					{{comfirmText || $t('common.okBtn')}}
				</a-button>
				<a-button class="operation" type="primary" :loading="loading" :disabled="privacyProtection||spinning" @click="showModal('addMask')"
					v-else-if="data.relationState == 0"
				>
					{{$t('common.addFriends')}}
				</a-button>
				<a-button class="operation" type="primary" :loading="loading" :disabled="spinning" @click="openThread"
					v-else-if="data.relationState == 1 || data.relationState == 3"
				>
					{{$t('userCard.sendMsg')}}
				</a-button>
				<a-button class="operation" type="primary" :loading="loading" :disabled="spinning" @click="checkBlackList"
					v-else-if="data.relationState == 2"
				>
					{{$t('userCard.AgreefriendApplication')}}
				</a-button>
			</template>
		</a-modal>

		<!--编辑头像-->
		<ImgCut :url="data.userAvatar" centered :getCutImg="getCutImg" :cancel="closeImgCut"
			:spinning="imgCutSpinning" v-if="!!userId && visible == 'imgCut'"
		></ImgCut>

		<!--删除好友-->
		<a-modal centered :getContainer="()=>$refs.userCard" class="notification-IM" :title="$t('common.prompt')"
			:visible="!!userId && visible == 'deleteUser'" :maskClosable="false" :width="438" :closable="false"
		>
			<!--<a-spin :spinning="spinning" :wrapperClassName="'spinning'">-->
			<p>{{$t('userCard.deleteFriendTip')}}</p>
			<!--</a-spin>-->
			<template #footer>
				<a-button type="primary" :loading="loading" @click="deleteFriend">
					{{$t('common.deleteFriends')}}
				</a-button>
				<a-button :disabled="loading" @click="doClose">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>

		<!--设置添加好友备注-->
		<a-modal centered :getContainer="()=>$refs.userCard" class="notification-IM addMask"
			:title="$t('common.addFriends')" :visible="!!userId && visible == 'addMask'" :maskClosable="false"
			:width="420" :closable="false"
		>
			<a-textarea :placeholder="$t('common.leaveMessage')" style="resize:none" rows="4" v-model.trim="addParams.followMsg" maxlength="20" />
			<template #footer>
				<a-button type="primary" :loading="loading" @click="handleAddUser">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button v-if="firstModal=='addMask'" :disabled="spinning" @click="cancel">
					{{$t('common.exitBtn')}}
				</a-button>
				<a-button v-else :disabled="loading" @click="showModal('userCard')">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>

		<!--名片发送面板-->
		<MultiplePanel v-if="visible == 'sendCard'" :visible="visible == 'sendCard'" limit="50" :confirm="getSelectUsers" :modeltitle="$t('common.sendCardTo')"
			:cancel="() => {showModal('userCard');msg_for_share='';}"
		>
			<div id="msg_for_share">
				<div>{{$t('common.leaveMessage')}}</div>
				<a-textarea v-model="msg_for_share" type="textarea" :autosize="{ minRows: 4, maxRows: 4 }" />
			</div>
		</MultiplePanel>

		<!-- 是否移出黑名单 -->
		<a-modal :title="$t('common.prompt')" class="notification-IM" centered :width="420" :closable="false"
			@cancel="doClose" :visible="visible=='isRemoveBlacklist'"
		>
			<p>{{$t('chat.blacklistOp[0]', { name: data.label||data.nickName })}}</p>
			<template #footer>
				<a-button type="primary" :disabled="loading" :loading="loading" @click="deleteBlackUser">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button @click="showModal('userCard')">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>
	</div>
</template>

<script>
	import moment from 'moment'
	import lang_zh_CN from 'ant-design-vue/es/date-picker/locale/zh_CN'
	import lang_zh_TW from 'ant-design-vue/es/date-picker/locale/zh_TW'
	import lang_en_US from 'ant-design-vue/es/date-picker/locale/en_US'
	import ImgCut from '@/components/ImgCut/index.vue'
	// import qun from '@/assets/img/qun_default@2x.png'
	import geren from '@/assets/img/geren_default@2x.png'
	import MultiplePanel from '@/components/MultiplePanel'
	import { isNickNameAllow } from '@/utils/web'

	export default {
		name: 'UserCard',
		components: { ImgCut, MultiplePanel },
		props: {
			userId: {
				type: [String, Number],
				require: true,
				default: ''
			},
			cancel: Function,
			comfirmText: {
				type: String,
				default: ''
			},
			comfirm: [Function, String],
			way: [String, Number],
			page: {
				type: String,
				default: ''
			},
			firstModal: {
				type: String,
				default: ''
			},
			progress: {
				type: String,
				default: ''
			},
			privacyProtection: {
				type: Boolean,
				default: false
			}
			//      loading: {
			//        type: Boolean,
			//        default: false
			//      }
		},
		data() {
			return {
				edit_birthday: false,
				edit_sex: false,
				previewAvatar: false,
				msg_for_share: '',
				spinning: false,
				loading: false,
				imgCutSpinning: false,
				visible: '',
				data: {},
				newNickName: '',
				nameEditabled: false,
				newLabel: '',
				labelEditabled: false,
				newAccountCode: '',
				accountCodeEditabled: false,
				currentGroup: '',
				groupEditabled: false,
				avatorParams: {
					category: 'user_avatar',
					batchNo: '',
					opNo: +new Date(),
					base64: ''
				},
				addParams: {
					userId: '',
					followMsg: '',
					way: ''
				}
			}
		},
		computed: {
			locale() {
				let lang
				switch (this.$store.state.Setting.lang) {
				case 'zh_CN':
					lang = lang_zh_CN
					break
				case 'zh_TW':
					lang = lang_zh_TW
					break
				case 'en_US':
					lang = lang_en_US
					break
				}
				return lang
			},
			mySex() {
				const sex = this.$store.state.User.accountInfo.sex
				return sex == 1 ? this.$t('common.sex[1]') : (sex === '' ? this.$t('common.sex[3]') : this.$t('common.sex[2]'))
			},
			myBirthday() {
				const birthday = this.$store.state.User.accountInfo.birthday
				return birthday ? moment(birthday, 'YYYY-MM-DD') : null
			},
			online() {
				return this.$store.state.Setting.online
			},
			friendGroups() {
				return this.$store.state.MyFriend.friendGroups
			}
		},
		watch: {
			async 'userId'(newVal, oldVal) {
				if (newVal) this.data = {} // 防止上一次用户数据显示
				if (!newVal) {
					this.visible = ''
					this.addParams = {
						userId: '',
						followMsg: '',
						way: ''
					}
					this.nameEditabled = false
					this.labelEditabled = false
					this.groupEditabled = false
					this.accountCodeEditabled = false
					return
				}

				this.getUserRelationInfo()

				if (this.firstModal) {
					this.showModal(this.firstModal)
				} else {
					this.showModal('userCard')
				}
			},
			'visible'(nal, oal) {
				if (nal == 'addMask' && !this.addParams.userId) {
					this.addParams = {
						userId: this.userId,
						followMsg: this.$t('common.IM') + this.$store.state.User.accountInfo.nickName,
						way: this.way || ''
					}
				}
			},
			'newNickName'(nVal, oVal) {
				// const reg = /^[0-9a-zA-Z\u4e00-\u9fa5]+$/
				if (nVal.length > 0) {
					// if (nVal.match(reg) == null) {
					// 	this.$message.warning('只可输入数字、汉字、字母')
					// 	this.newNickName = oVal
					// }
					if (!isNickNameAllow(nVal)) {
						this.$message.warning(this.$t('login.inputTip1[0]'))
						this.newNickName = oVal
					}
				}
			},
			'newLabel'(nVal, oVal) {
				// const reg = /^[0-9a-zA-Z\u4e00-\u9fa5]+$/
				if (nVal.length > 0) {
					// if (nVal.match(reg) == null) {
					// 	this.$message.warning('只可输入数字、汉字、字母')
					// 	this.newLabel = oVal
					// }
					if (!isNickNameAllow(nVal)) {
						this.$message.warning(this.$t('login.inputTip1[0]'))
						this.newLabel = oVal
					}
				}
			}
		},
		methods: {
			disabledDate(current) {
				return current && current > moment().endOf('day')
			},

			cancelEditBirthday() {
				this.edit_birthday = false
			},
			cancelEditSex() {
				this.edit_sex = false
			},
			editMyInfo(e) {
				const updatingData = {}
				if (this.edit_birthday) {
					if (!e) return
					updatingData.birthday = moment(e).format('YYYY-MM-DD')
				} else {
					updatingData.sex = e
				}

				this.spinning = true
				this.$utils.api.user.updateUserExtInfo(updatingData).get().then(res => { // 未上传过头像时会返回新的头像
					this.$store.commit('User/UPDATE_ACCOUNTINFO', updatingData)

					this.edit_birthday = false
					this.edit_sex = false
					this.spinning = false
				}).catch((e) => {
					this.edit_birthday = false
					this.edit_sex = false
					this.spinning = false
				})
			},
			switchAvatarPreviewer(e) {
				if (e && e.target.offsetParent && e.target.offsetParent.id === 'usercardAvatar' && this.data.relationState != 3 && this.data.userAvatar != geren && this.data.avatarType == 0 && !this.previewAvatar) {
					this.previewAvatar = true
				} else if (this.previewAvatar) {
					this.previewAvatar = false
				}
			},
			sendAudio() {
				if (!this.onlineCheck()) return
				if (this.$store.state.OPcomponent.hasRealCall) {
					this.$message.error('当前正在通话中')
					return
				}
				this.cancel()
				const accountInfo = this.$store.state.User.accountInfo
				const userInfo = this.$store.getters['User/userInfo'](this.data.userId)
				const friendInfo = this.$store.getters['MyFriend/friendInfo'](this.data.userId)
				this.$utils.fun.createWin({
					action: 'openRealAudioWin',
					params: {
						cForm: this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_REQUEST,
						userName: friendInfo.label || userInfo.nickName,
						userAvatar: userInfo.userAvatar,
						threadId: friendInfo.groupId,
						meta: { // 发送者
							userId: accountInfo.userId,
							nickName: accountInfo.nickName,
							userAvatar: accountInfo.userAvatar,
							groupType: 0,
							clientType: process.env.webConfig.client_type
						},
						isSend: true
					}
				})
			},
			afterClose() {
				this.previewAvatar = false
			},
			initProgress() {
				const nVal = this.$props.progress
				this.$nextTick(() => {
					if (nVal == 'editName') {
						this.initEditName()
					} else if (nVal == 'editLabel') {
						this.initEditLabel()
					} else if (nVal == 'editAccountCode') {
						this.initEditAccountCode()
					}
				})
			},
			avatarError() {
				this.data.userAvatar = geren
			},
			getUserRelationInfo() {
				this.spinning = true
				// whence: 0-申请审核列表（涉及relationState的值）  1-添加好友入口----2020/2/18再次启用
				const whence = this.$route.fullPath == '/addressBook/newFriends' ? '0' : '1'
				this.$utils.api.user.getUserRelationInfo({ userId: this.userId,	whence, custError: true }).get().then(res => {
					console.log('用户信息：', res)
					this.spinning = false
					this.data = res.data
					this.currentGroup = this.data.friendGroupId
					this.initProgress()
				}).catch(e => {
					console.log('用户信息：', e)
					this.spinning = false
					if (e.code === 601004) { // 用户账号已注销
						this.data = {
							code: 1,
							nickName: this.$t('userCard.accountCancel'),
							userAvatar: geren
						}
					} else if (e.code == 601005) { // 用户退出企业
						this.$message.error(this.$t('organization.quit'))
						this.cancel()
					} else if (e.code === 506001 || e.code === 506) {
						this.$message.error(this.$t('common.loginInfoExpired'))
						this.$store.dispatch('Setting/set_pageLoading', { content: this.$t('common.exiting') + '...', translucent: true })
						const timer = setTimeout(async() => {
							clearTimeout(timer)
							await this.$utils.fun.logout()
							this.$store.commit('initState')
							this.$router.push({ path: '/login', replace: true, query: { resize: true }})
							this.$store.dispatch('Setting/set_pageLoading', '')
						}, 3000)
					}
				})
			},
			showModal(val) {
				this.visible = val
			},
			closeImgCut() {
				this.visible = 'userCard'
			},
			deleteFriend() { // 删除用户
				this.loading = true
				this.$utils.api.user.deleteFriend({ friendUserId: this.data.userId }).get().then(res => {
					Promise.all([
						this.$store.dispatch('MyFriend/delete_info', { userId: this.data.userId }),
						this.$store.dispatch('NewFriend/set_list'),
						this.$store.dispatch('Chat/killThread', { groupId: this.data.groupId })
					]).then(async res => {
						await this.$utils.chatSdk.cCleanAsync(`${this.data.groupId}`, '')
						this.loading = false
						this.cancel()
					})
				}).catch((e) => {
					this.loading = false
				})
			},
			initEditName() { // 开启修改昵称
				this.newNickName = this.data.nickName
				this.nameEditabled = true
				this.$nextTick(() => {
					this.$refs.nickNameInp.focus()
				})
			},
			handleEditName() { // 修改昵称
				if (!this.data.userId)	return
				const reg = /^\s*$/
				if (this.newNickName && (!this.newNickName.match(reg)) && this.newNickName !== this.data.nickName) {
					this.spinning = true
					this.$utils.api.user.updateUserExtInfo({ nickName: this.newNickName }).get().then(res => { // 未上传过头像时会返回新的头像
						this.spinning = false
						//  修改当前账号数据
						const userInfo = { ...this.$store.state.User.accountInfo }
						userInfo.nickName = res.data.nickName
						if (res.data.userAvatar) userInfo.userAvatar = res.data.userAvatar
						this.$store.dispatch('User/set_accountInfo', userInfo)
						//  修改本地用户列表数据
						const info = { userId: this.data.userId, nickName: res.data.nickName }
						if (res.data.userAvatar) info.userAvatar = res.data.userAvatar
						this.$store.dispatch('User/update_info', info)

						this.$store.dispatch('Chat/preUpdateThread', { userId: this.data.userId })
						// 更新新的好友本地数据---2019.10.31不会出现userId==自己的数据
						//            let newFriendInfo = {fromUserId: this.data.userId, fromNickName: res.data.nickName}
						//            if (res.data.userAvatar) newFriendInfo.userAvatar = res.data.userAvatar
						//            this.$store.dispatch('NewFriend/update_info', newFriendInfo)

						this.data.nickName = res.data.nickName
						if (res.data.userAvatar) this.data.userAvatar = res.data.userAvatar
						this.nameEditabled = false
					}).catch((e) => {
						this.spinning = false
					})
				} else {
					this.nameEditabled = false
				}
			},
			initEditLabel() { // 开启修改备注
				this.newLabel = this.data.label
				this.labelEditabled = true
				this.$nextTick(() => {
					this.$refs.labelInp.focus()
				})
			},
			handleEditLabel() { // 修改备注
				if (!this.data.userId)	return
				if (this.newLabel !== this.data.label) {
					const params = { friendUserId: this.data.userId, label: this.newLabel }
					//          this.spinning = true
					this.$utils.api.user.updateFriendLabel(params).get().then(async res => {
						//            this.spinning = false
						//            console.log('修改备注', res)
						this.data.label = this.newLabel
						// 修改新的好友数据
						this.$store.dispatch('NewFriend/update_info', {
							fromUserId: this.data.userId,
							fromUserLabel: this.newLabel || this.data.nickName
						})
						//  修改我的好友列表数据
						await this.$store.dispatch('MyFriend/update_info', { userId: this.data.userId, label: this.newLabel })
						this.$store.dispatch('Chat/preUpdateThread', { userId: this.data.userId })
						this.labelEditabled = false
					}).catch((e) => {
						console.log(e)
						if (e.code === 601004) { // 用户账号已注销
							this.data = {
								code: 1,
								nickName: this.$t('userCard.accountCancel'),
								userAvatar: geren
							}
						} else if (e.code == 601005) { // 用户退出企业
							this.$message.error(this.$t('organization.quit'))
							this.cancel()
						}
						this.labelEditabled = false
					})
				} else {
					this.labelEditabled = false
				}
			},
			initEditAccountCode() { // 开启修改AccountCode
				this.newAccountCode = this.data.accountCode
				this.accountCodeEditabled = true
				this.$nextTick(() => {
					this.$refs.accountCodeInp.focus()
				})
			},
			_checkAccountCode()	{
				const reg = /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/
				if (this.newAccountCode.match(reg) == null) {
					this.$message.warning(this.$t('userCard.incorrectFormat'))
					return
				}
				this.$utils.api.user.checkAccountCode({ accountCode: this.newAccountCode }).get().then(res => {
					if (res.data.isUsed) {
						this.$message.warning(this.$t('userCard.idWasTaken'))
						return
					}
					this.handleEditAccountCode()
				})
			},
			handleEditAccountCode() { // 修改AccountCode
				if (!this.data.userId)	return
				if (this.newAccountCode !== this.data.accountCode) {
					const params = { accountCode: this.newAccountCode }
					this.$utils.api.user.updateAccountCode(params).get().then(res => {
						console.log('修改id返回：', res)
						const userInfo = Object.assign({}, this.$store.state.User.accountInfo, { accountCode: res.data.accountCode || this.newAccountCode })
						this.$store.dispatch('User/set_accountInfo', userInfo)
						// 登录方式为id时修改保存的id
						if (this.$store.state.Setting.sysConfig.loginType === '0') {
							this.$store.dispatch('Setting/set_sysConfig', {
								data: {
									loginName: res.data.accountCode || this.newAccountCode
								}
							})
						}
						//  修改本地用户列表数据
						const info = { userId: this.data.userId, accountCode: res.data.accountCode || this.newAccountCode }
						this.$store.dispatch('User/update_info', info)
						this.data.accountCode = this.newAccountCode
						this.$set(this.data, 'idEditable', 0)
						this.accountCodeEditabled = false
					}).catch((e) => {
						console.log(e)
						this.accountCodeEditabled = false
					})
				} else {
					this.accountCodeEditabled = false
				}
			},
			initEditGroup() {
				this.groupEditabled = true
			},
			handleEditGroup(value) {
				const params = { userId: this.data.userId, friendGroupId: value }
				const groupInfo = this.friendGroups.find(item => {
					return item.friendGroupId == value
				})
				this.$utils.api.user.updateFriendGroup(params).get().then(res => {
					this.groupEditabled = false
					this.currentGroup = value
					this.data.friendGroupName = groupInfo.friendGroupName
					this.$store.dispatch('MyFriend/update_info', { userId: this.data.userId, friendGroupId: value })
				}).catch((e) => {
					this.data.friendGroupId = this.currentGroup
				})
			},
			initEditAvator() { // 开启修改头像
				if (this.data.relationState == 3) {
					if (this.online) this.visible = 'imgCut'
					else this.$message.error(this.$t('common.netErrorTip[0]'))
				}
			},
			getCutImg(file) { // 接收截图
				this.imgCutSpinning = true
				this.$utils.api.user.getUserInfo({ userId: this.data.userId }).get().then(res => {
					this.avatorParams.batchNo = res.data.userAvatarBatchNo
					this.avatorParams.base64 = file
					this.uploadAvator()
				}).catch((e) => {
					this.imgCutSpinning = false
				})
			},
			uploadAvator() { // 上传截图
				//        let formData = new FormData()
				//        for(let key in this.avatorParams){
				//          if (key != 'file') formData.append(key, this.avatorParams[key])
				//        }
				this.$utils.api.public.upload(this.avatorParams).get().then(res => {
					//             console.log('上传成功', res)
					this.handleEditAvator(res.data.list[0])
				}).catch((e) => {
					this.imgCutSpinning = false
				})
			},
			handleEditAvator(data) { // 修改头像信息
				this.$utils.api.user.updateUserExtInfo({
					userAvatar: data.batchNo,
					opNo: this.avatorParams.opNo
				}).get().then(res => {
					this.imgCutSpinning = false
					//          console.log('头像更新成功', res)
					//  修改当前用户信息
					const userInfo = { ...this.$store.state.User.accountInfo }
					userInfo.userAvatar = data.url
					Promise.all([
						this.$store.dispatch('User/set_accountInfo', userInfo),
						this.$store.dispatch('User/update_info', { userId: this.data.userId, userAvatar: data.url })
					]).then(res => {
						this.data.userAvatar = data.url
						this.visible = 'userCard'
						this.$store.dispatch('Chat/preUpdateThread', { userId: this.data.userId })
					})
				}).catch((e) => {
					this.imgCutSpinning = false
				})
			},
			// 发送消息
			openThread() {
				const id = this.data.groupId
				const type = 0// 0:单聊  1：群聊  2：临时聊天
				this.cancel('openThread')
				this.$store.dispatch('Chat/openThread', { id, type })
			},
			handleAddUser() { // 发送添加好友申请
				this.loading = true
				this.$utils.api.user.applyAddFriend(this.addParams).get().then(res => {
					this.loading = false
					this.cancel()
					this.$message.success(res.data.joinState == 2 ? this.$t('common.alreadyFriends') : this.$t('common.sendSuccessfully'))
				}).catch((e) => {
					this.loading = false
				})
			},
			checkBlackList() {
				if (this.data.isOnBlacklist == 1) {
					this.visible = 'isRemoveBlacklist'
				}	else {
					this.agreeApply()
				}
			},
			deleteBlackUser(item) {
				this.loading = true
				this.$utils.api.user.deleteBlackUser({ blacklistUserId: this.data.userId }).get().then(res => {
					this.agreeApply()
				}).catch(() => { this.loading = false })
			},
			agreeApply() { // 同意添加为好友
				this.loading = true
				this.$utils.api.message.processApply({ id: this.data.notifyId, action: '1' }).get().then(res => {
					// console.log('申请处理', res)
					this.loading = false
					// 更新本地关联数据
					Promise.all([
						this.$store.dispatch('NewFriend/update_info', { id: this.data.notifyId, state: '1' }),
						this.$store.dispatch('MyFriend/set_list'),
						this.$store.dispatch('User/update_info', { userId: this.data.userId })
					]).then(res => {
						const newFriendInfo = this.$store.getters['NewFriend/friendInfo'](this.data.userId)
						this.$store.dispatch('Chat/getNewFriend', {
							friendID: this.data.userId,
							isApplicant: false,
							content: newFriendInfo.followMsg || '',
							applyTime: newFriendInfo.createTimeMills
						})
						this.cancel()
					}).catch((e) => {
						this.loading = false
						this.$message.error(e.message)
					})
				}).catch((e) => {
					this.loading = false
					this.$message.error(e.message)
				})
			},
			async getSelectUsers(friends) {
				if (!this.onlineCheck()) return
				this.cancel()
				const { userId, userAvatar, nickName } = this.data
				const sendingMsg = {
					text: { userId, userAvatar, nickName }
				}
				let targetThread
				let friend
				// let hasError = false
				for (let i = 0; i < friends.length; i++) {
					friend = friends[i]
					// 如果不存在会话，先创建
					targetThread = this.$store.getters['Chat/someThread'](friend.groupId)
					if (!targetThread) {
						const res = await this.$store.dispatch('Chat/createThread', {
							threadID: friend.groupId,
							threadType: friend.groupUsers ? 1 : 0
						})
						if (res && res.code != 0) {
							this.$message.error('名片发送异常')
						}
					} else if (targetThread.hidden != 0) { // 如果消息所属会话隐藏，则显示
						await this.$store.dispatch('Chat/updateThread', {
							threadID: friend.groupId,
							updatingData: { hidden: 0 }
						})
					}
					const res = await this.$store.dispatch('Chat/sendMessage', {
						msg: sendingMsg,
						thread: this.$store.getters['Chat/someThread'](friend.groupId)
					})
					if (res && res.code != 0) {
						// hasError = true
					}

					if (this.msg_for_share) {
						targetThread = this.$store.getters['Chat/someThread'](friend.groupId)
						const res2 = await this.$store.dispatch('Chat/sendMessage', {
							msg: {
								text: this.msg_for_share
							},
							thread: targetThread
						})

						if (res2 && res2.code != 0) {
							// hasError = true
						}
					}
				}
				/* if (hasError) {
					this.$message.error('名片发送异常')
				} else {
					this.$message.success(this.$t('chat.cardWasSent'))
				}*/

				this.msg_for_share = ''
			},
			doClose() {
				if (this.firstModal && this.firstModal != 'userCard') {
					this.cancel()
				} else {
					this.showModal('userCard')
				}
			}
		}
	}
</script>

<style lang="scss">
	#multiple-panel .panel-body .left .left-bottom{
		padding-top: 0;
		border-top: 1px solid #E6E6E6;
	}

	#msg_for_share{
		padding-bottom: 24px;
		div{
			line-height: 40px;
		}
	}

  .user-card-main {
    z-index: 1300;

	.ant-calendar-input-wrap{
		display: none!important;
	}

    .user-card {
      p {
        word-break: break-all
      }
      .ant-modal-content {
        .iconbeizhu {
          color: $gray;
          font-weight: normal;
          padding-left: 3px;
          position: relative;
          top: 1px;
          cursor: pointer;
        }
        .iconxiangxia {
          color: $gray;
          font-size: 12px;
          font-weight: bold;
          padding-left: 3px;
          position: relative;
          top: 1px;
          cursor: pointer;
        }
        .ant-modal-body {
          padding: 32px 30px 12px;
          .header {
            display: flex;
            flex-flow: row nowrap;
            align-items: center;
            padding-bottom: 20px;
            border-bottom: $border;
            .name {
              flex: 1 1 auto;
              padding-right: 20px;
              p {
                user-select: text;
                margin: 0;
                color: $black;
                line-height: 20px;
				font-weight: bold;
				font-size: 20px;
				word-break: break-word;
              }
              .opt {
                color: $lightBlack;
                font-size: 18px;
                padding: 5px;
                margin-right: 14px;
                background-color: #F1F2F6;
                border-radius: 50%;
                position: relative;
                top: 16px;
                cursor: pointer;
                &:hover {
                  color: $darkBlue;
                  /*&:after{
                      content: '解除好友';
                      color: #FFF;
                      font-size: 12px;
                      line-height: 30px;
                      width: 68px;
                      height: 30px;
                      text-align: center;
                      background-color: #000;
                      border-radius: 4px;
                      position: absolute;
                      top: -35px;
                      left: 0;
                  }*/
                }
              }
            }
            .avtor {
              flex: 0 0 auto;
			  position: relative;
			  background-color: $black;
			  margin-right: 12px;
			  &.backgroundColorWhite{
				background-color: #fff!important;
			  }
              &.edit {
                &:after {
                  content: '更换头像';
                  display: inline-block;
                  width: 100%;
                  height: 0;
                  background-color: $black;
                  opacity: 0.8;
                  color: #FFF;
                  font-size: 12px;
                  line-height: 64px;
                  position: absolute;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  height: 0;
                  transform-origin: bottom;
                  transition: height .25s ease-in-out;
                }
                &:hover {
                  &:after {
                    height: 100%;
                  }
                }
              }
            }
          }

		  .avatar-previewer{
			  position: absolute;
			  z-index:1;
			  top:110px;
			  left:139px;
			  width:300px;
			  height: 300px;
			  padding:8px;
			  background: #fff;
			  box-sizing: border-box;
			  box-shadow: 0px 2px 16px 0px rgba(0, 0, 0, 0.1);
			  border-radius: 4px;
			  img{
				  width:100%;
				  height:100%;
			  }
			  &::before{
				  content:'';
				  position: absolute;
				  top:-10px;
				  left:50%;
				  margin-left: -10px;
				  @include triangle('up',10px,10px,#fff);
			  }
		  }

          .main {
			.work-status{
				min-height: 62px;
				display: flex;
				padding: 22px 0;
				border-bottom: 1px solid #e6e6e6;
				img{
					width:20px;
					height:20px;
					margin-right: 8px;
					margin-top: 3px;
				}
				span{
					flex:1;
					line-height: 20px;
					word-break: break-all;
					color: #333333;
				}
			}
            h3 {
              margin: 0;
              padding: 0;
              color: $black;
              font-size: 16px;
              line-height: 54px;
              font-weight: bold;
            }
            .item {
              display: flex;
              flex-flow: row nowrap;
              align-items: center;
              line-height: 40px;
              .label {
                flex: 0 0 auto;
                width: 80px;
                color: $gray;
                font-size: 14px;
                /*line-height: 40px;*/
              }
              .value {
                color: $black;
                font-size: 14px;
                font-weight: 400;
                /*line-height: 40px;*/
                p {
                  /*display: -webkit-box;*/
                  /*-webkit-line-clamp:1;*/
                  /*-webkit-box-orient:vertical;*/
                  /*max-height: 40px;*/
                  /*overflow: hidden;*/
                  /*text-overflow: ellipsis;*/
                  /*cursor: pointer;*/
                  user-select: text;
                  margin: 0;
                }
              }
            }
          }
        }
        .ant-modal-footer {
          border: none;
          padding: 0px 29px 36px;
          text-align: center;
          .operation {
            width: 100%;
          }
        }
      }
			.tip{
				color: #999;
				font-size: 12px;
				padding-left: 80px;
			}
    }
    .addMask {
      .ant-modal-footer {
        border-top: none;
        padding: 0 10px 30px;
      }
    }
  }
</style>

