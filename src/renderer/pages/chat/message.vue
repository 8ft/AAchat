<template>
	<div id="current_chat" v-if="thread" ref="current_chat" @drop.prevent="handleDrop" @dragover.prevent="handleDragover" @dragleave.prevent="handleDragleave" @dragend.prevent="handleDragend">
		<div class="chat-left">
			<!--聊天头-->
			<div @dblclick.stop="maxWindow">
				<thread :thread="thread" locate="in-chat" :onlineCount="onlineCount" class="message-header"></thread>
			</div>
			<!--聊天窗-->
			<div
				id="content"
				ref="messageList"
				:class="{hide:$store.state.Chat.preloading===true}"
				@mousedown.left.prevent="mouseDown"
				@mousemove.left.prevent="mouseMove"
				@mouseup.left.prevent="mouseUp"
				@mouseleave.left.prevent="mouseLeave"
			>
				<div ref="moveSelected" class="moveSelected" />
				<a-spin size="small" :spinning="loadingMessage" style="display:block;width:100%;position:absolute;top:4px;left:0;z-index: 20" />
				<vue-scroll ref="bubbles" :ops="scrollOptions" @handle-scroll="onScroll" @handle-resize="onMessageListResize">
					<!--产品要求下面的提醒先去掉-->
					<!--<div :class="{tip:true,show:nomore||$store.state.Chat.pageCount-page==0}">{{$t('chat.aboutSecurity')}}</div>-->

					<template v-if="thread.id=='point'">
						<point-card
							v-for="message in messages"
							:message="message"
							:key="`msg${message.originID}`"
						/>
					</template>

					<template v-else>
						<chat-bubble
							v-for="(message,index) in messages"
							:style="index==0?'margin-top:20px;':''"
							:key="`msg${message.originID}`"
							:preMsgTime="messages[index-1]?parseInt(messages[index-1].timestamp):0"
							:message="message"
							:select-array="selectedList"
							:selectable="selectable"
							:drag-flag="dragFlag"
							:chat-to-myself="chatToMyself"
							:scroll-target="scrollTarget==message.id"
							:banned="bannedTime!==''"
							:isGroupManager="isGroupManager"
							:inview="messagesInView.includes(message.originID)"
							@delMsg="(e)=>{selectedList.push(e.id);preDelMsg=true;}"
							@withdraw="msgWithdraw(message)"
							@update="msgUpdate"
							@resend="resendMessage"
							@share="share"
							@multiSelect="multiSelect"
							@readChatRecords="(info)=>chatRecordInfo=info"
							@showReadStatus="(e)=>{readStatusListData=e}"
							@trigger="bubbleTriger"
							@reply="(target)=>{replyTarget=target}"
							@realAudio="_handleRealAudio"
							@edit="(data)=>{reEditData=data}"
							@make-friend="makeFriend"
							@show-user-card="showUserCard"
						/>
					</template>
				</vue-scroll>
			</div>

			<!--输入框-->
			<editor
				ref="editor"
				v-show="thread.type !=10001"
				style="z-index: 200;color: #333333"
				:hide="selectable"
				:thread="thread"
				:groupMembers="groupMembers"
				:reply-target="replyTarget"
				:edit-data="reEditData"
				:banned-time="bannedTime"
				@done="sendMessage"
				@init-reply-target="(target)=>{replyTarget=target}"
				@init-reedit-data="reEditData={id:''}"
				:setup-opened="showThreadFile||showThreadSetup"
			>
				<!--发送名片-->
				<a-tooltip
					slot="tools"
					placement="top"
					:title="$t('common.sendCard')"
				>
					<div class="iconfont iconfasongmingpian" @click="preSendUserCard=true" />
				</a-tooltip>

				<!--双向撤回-->
				<a-tooltip
					v-if="$store.state.Setting.organParamsConfig.showDeleteBothAll==1"
					slot="tools"
					placement="top"
					:title="$t('common.recall')"
				>
					<div class="iconfont iconshuangxiangchehui" @click="preWithdraw=true" />
				</a-tooltip>
				<!--语音通话-->
				<!--<a-tooltip slot="tools" placement="top" title="语音通话" v-if="thread.type === 0">
					<div class="iconfont icondianhua-srk" @click="_handleRealAudio"></div>
				</a-tooltip>-->
			</editor>
			<!--未读消息-->
		</div>

		<div class="chat-right" v-if="thread.type !=10001">
			<a-tooltip
				placement="left"
				:title="thread.type === 1 ? $t('chat.groupSettings') : $t('chat.chatSettings')"
			>
				<div
					id="chatSetupSwitch"
					v-if="thread.type===0||(thread.type==1&&thread.latestStatus=='8')"
					class="iconfont iconliaotianshezhi"
					@click="showThreadSetup=true"
				/>
			</a-tooltip>
			<a-tooltip
				placement="left"
				:title="$t('chat.file')"
			>
				<div
					v-if="thread.id!=='notify'"
					id="chatFileSwitch"
					class="iconfont iconwenjianjia1"
					@click="showThreadFile=true"
				>
				</div>
			</a-tooltip>
		</div>

		<!--未读快速定位-->
		<div
			v-show="firstUnreadMsg&&!firstAtMe"
			class="has-new-msg unread"
			@click="$refs.bubbles.scrollIntoView(`#msg${firstUnreadMsg}`, 100);firstUnreadMsg='';unreadCount=0;"
		>
			<span class="iconfont iconjiantou--" />
			{{$tc('chat.messagesCount', unreadCount>=100?'99+':unreadCount)}}
		</div>

		<!--有人@我快速定位-->
		<div
			v-show="firstAtMe"
			class="has-new-msg unread"
			@click="scrollToFirstAtMe"
		>
			<span class="iconfont iconjiantou--" />{{$t('chat.aite[1]')}}
		</div>

		<!--新消息快速定位-->
		<div v-show="firstNewMsg&&!replyTarget.id" class="has-new-msg" @click="scrollToEnd();firstNewMsg='';newMsgCount=0;">
			<span class="iconfont iconjiantou-" />
			{{$tc('chat.messagesCount', newMsgCount)}}
		</div>

		<!--删除消息弹窗-->
		<a-modal
			:visible="preDelMsg"
			class="notification-IM"
			:getContainer="()=>$refs.current_chat"
			:title="$t('chat.deleteMessageTip[0]')"
			centered
			:width="436"
			:maskClosable="false"
			@cancel="preDelMsg=false;selectedList=[];"
		>
			<p>{{selectedList.length>1?$t('chat.deleteMessageTip[2]'):$t('chat.deleteMessageTip[1]')}}</p>
			<template #footer>
				<a-button
					type="primary"
					:loading="deletingMsg"
					@click="delMsgFun"
				>
					{{$t('common.yesBtn')}}
				</a-button>
				<a-button @click="preDelMsg=false;selectedList=[];">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>

		<!--转发特殊信息弹窗-->
		<a-modal
			:visible="sharingSpecialMsgs"
			class="notification-IM"
			:getContainer="()=>$refs.current_chat"
			:title="$t('common.prompt')"
			centered
			:width="436"
			:maskClosable="false"
			@cancel="sharingSpecialMsgs=false;selectable=false;selectedList=[];serverFileExistList=[]"
		>
			<p>{{$t('chat.forwardTip[1]')}}</p>
			<template #footer>
				<a-button type="primary" @click="shareMsgs">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button
					@click="sharingSpecialMsgs=false;mergeSharingMessages=false;selectable=false;selectedList=[];serverFileExistList=[]"
				>
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>

		<a-modal :title="$t('chat.sendFileTip[0]') + ' - ' + $t('chat.sendFileTip[1]', { size: clientFileMaxSize })" :closable="false" centered class="notification-IM" :z-index="10000" :visible="sizeTipVisible" :width="438">
			<p v-for="(item, index) in sizeTipMessage" :key="index">
				{{item.name}} - <span style="color: #8098F8">{{item.size}}</span>
			</p>
			<template #footer>
				<a-button type="primary" @click="sizeTipVisible = false">
					{{$t('common.okBtn')}}
				</a-button>
			</template>
		</a-modal>
		<MultiplePanel
			v-if="selectingFriends"
			:visible="selectingFriends"
			:confirm="onSelectedFriends"
			:cancel="cancelSelectFriend"
			limit="50"
			:modeltitle="$t('common.relay')"
		>
			<div id="msg_for_share">
				<div>{{$t('common.leaveMessage')}}</div>
				<a-textarea v-model="msg_for_share" type="textarea" :autosize="{ minRows: 4, maxRows: 4 }" />
			</div>
		</MultiplePanel>
		<template v-if="thread.type!==10001">
			<!-- 消息已读数据 -->
			<read-status
				v-if="readStatusListData.x"
				:info="readStatusListData"
				:group-members="groupMembers"
				@hide="readStatusListData={}"
			/>

			<!-- 选择联系人 -->
			<friend-selector
				v-model="preSendUserCard"
				:thread="thread"
				@cancel="preSendUserCard=false;"
			/>

			<!--选择工具栏-->
			<div class="chat-tool" :class="{'show': selectable}">
				<div class="btn">
					<p class="iconfont iconzhutiaozhuanfa-" @click="preShareMsgs(false)" />{{$t('chat.forward-one-by-one')}}
				</div>
				<div class="btn">
					<p class="iconfont iconhebingzhuanfa-" @click="preShareMsgs(true)"></p>{{$t('chat.combineAndForward')}}
				</div>
				<!-- <div class="btn">
					<p class="iconfont iconfuzhi-1"></p>复制
				</div>-->
				<div class="btn">
					<p class="iconfont iconshanchu-1" @click="delMsg" />{{$t('common.delete')}}
				</div>
				<div class="btn">
					<p class="iconfont iconguanbi-1" @click="exitTool" />
				</div>
			</div>

			<!--聊天设置-->
			<chat-setup
				v-if="(thread.type==1&&thread.latestStatus=='8')||thread.type==0"
				:animate="setupAnimate"
				:visible="showThreadSetup"
				:isGroupOwner="isGroupOwner"
				:isGroupManager="isGroupManager"
				@hide="showThreadSetup=false;"
				:thread="thread"
				:groupMembers="groupMembers"
			/>

			<!--回复详情-->
			<reply-detail
				:base-info="replyInfo"
				:animate="setupAnimate"
				:visible="showReplyDetail"
				@hide="hideReplyDetail"
				@targetUpdated="updateReplyTarget"
			/>

			<!--聊天文件-->
			<chat-file
				:visible="showThreadFile"
				:thread="thread"
				@fileSelect="fileSelect"
				@share="share"
				@delMsg="(e)=>{selectedList.push(e.id);preDelMsg=true;}"
				@hide="showThreadFile=false;"
			/>

			<!--撤回弹窗-->
			<a-modal
				:visible="preWithdraw"
				class="notification-IM"
				:getContainer="()=>$refs.current_chat"
				:title="withdrawTarget?$t('common.prompt'):$t('common.recall')"
				centered
				:width="436"
				:maskClosable="false"
				@cancel="preWithdraw=false"
			>
				<p>{{withdrawTarget?$t('chat.aboutRecalledTip[0]'):$t('chat.aboutRecalledTip[1]')}}</p>
				<template #footer>
					<a-button
						type="primary"
						:loading="withdrawing"
						@click="withdraw(withdrawTarget)"
					>
						{{$t('common.okBtn')}}
					</a-button>
					<a-button @click="cancelWithdraw">
						{{$t('common.exitBtn')}}
					</a-button>
				</template>
			</a-modal>

			<!--移除黑名单-->
			<a-modal
				:visible="preRemovingFromBlackList"
				class="notification-IM"
				:title="$t('common.prompt')"
				:getContainer="()=>$refs.current_chat"
				centered
				:width="436"
				:maskClosable="false"
				@cancel="preRemovingFromBlackList=false"
			>
				<p>{{removingText}}</p>
				<template #footer>
					<a-button
						type="primary"
						:loading="removingFromBlackList"
						@click="removeFromBlackList"
					>
						{{$t('common.okBtn')}}
					</a-button>
					<a-button @click="preRemovingFromBlackList=false;">
						{{$t('common.exitBtn')}}
					</a-button>
				</template>
			</a-modal>

			<!--锁定提示-->
			<a-modal
				:visible="isLocked"
				class="notification-IM"
				:getContainer="()=>$refs.current_chat"
				:title="$t('common.prompt')"
				centered
				:width="436"
				:maskClosable="false"
				:closable="false"
			>
				<p>{{$t('chat.lockGroupTip[0]')}}</p>
				<template #footer>
					<a-button
						type="primary"
						@click="$store.dispatch('Chat/switchThread',{threadID:''})"
					>
						{{$t('common.gotIt')}}
					</a-button>
				</template>
			</a-modal>

			<chat-record
				:record-info="chatRecordInfo"
				@hide="hideChatRecord"
				@show-user-card="showUserCard"
			></chat-record>

			<collection-model ref="collectionModel" :detaildata="collectionData"></collection-model>
		</template>
	</div>
</template>

<script>
	import Thread from './components/Thread'
	import ChatBubble from './components/ChatBubble'
	import PointCard from './components/PointCard'
	import ChatRecord from './components/ChatRecord'
	import Editor from './components/Editor'
	import ChatSetup from './components/Setup'
	import ReplyDetail from './components/ReplyDetail'
	import ChatFile from './components/ChatFile'
	import ReadStatus from './components/ReadStatus'
	import FriendSelector from './components/FriendSelector'
	import MultiplePanel from '@/components/MultiplePanel'
	import vueScroll from 'vuescroll/dist/vuescroll-native'
	import { mapActions } from 'vuex'
	import Message from '@/mixins/message.vue'
	import CollectionModel from '@/pages/collection/detailmodel'

	export default {
		name: 'Message',
		mixins: [Message],
		components: {
			Thread,
			ChatBubble,
			PointCard,
			ChatRecord,
			Editor,
			ChatSetup,
			ReplyDetail,
			ChatFile,
			ReadStatus,
			FriendSelector,
			MultiplePanel,
			vueScroll,
			CollectionModel
		},

		data() {
			return {
				withdrawMsgs: [], // 被撤回的消息

				reEditData: { id: '' },

				scrollTarget: '',

				preRemovingFromBlackList: false,
				removingText: '',
				removingFromBlackList: false,
				removingUserId: '',

				lastMsgCount: 0,
				lastMessageID: '', // 记录当前最后一条消息时间，用于判断是否有新消息插入，触发onMessageListResize时可用于控制页面滚动

				sizeTipVisible: false,
				sizeTipMessage: [],
				serverFileExistList: [], // 文件过期数组
				onlineCount: 0,

				replyTarget: {},
				replyInfo: {},

				setupAnimate: true,
				showThreadSetup: false,
				showReplyDetail: false,
				showThreadFile: false,
				moveSelected: null,
				oldLeft: 0,
				oldTop: 0,
				dragFlag: false,
				moveSelectedRect: {},
				messageListRect: {},
				isMouseMove: false,
				selectedList: [],
				selectable: false,

				preSendUserCard: false,

				readStatusListData: {},

				collectionData: {},

				chatRecordInfo: {},

				mergeSharingMessages: false,
				sharingSpecialMsgs: false,
				msg_for_share: '',

				preWithdraw: false,
				withdrawing: false,
				withdrawTarget: null,

				preDelMsg: false,
				deletingMsg: false,

				selectingFriends: false,
				sharingMessages: null,

				unreadCount: 0,
				newMsgCount: 0,
				firstUnreadMsg: '',
				firstNewMsg: '',
				firstAtMe: '',

				scrollH: -1, // 滚动条高度
				scrollTop: 0, // 滚动条位置
				loadingMessage: false, // 拉取消息中
				nomore: false, // 消息拉取完毕
				nomoreLocalData: false, // 本地消息拉取完毕

				messagesInView: [],
				scrollTimeoutID: '',
				scrollOptions: {
					vuescroll: {
						wheelScrollDuration: 300
					},
					scrollPanel: {
						scrollingX: false
					},
					bar: {
						background: 'lightGray',
						onlyShowBarOnScroll: false,
						minSize: 0.15,
						size: '8px'
					}
				}
			}
		},

		activated() {
			if (this.scrollTop) { // 还原滚动条位置
				this.$refs.bubbles.scrollTo(
					{
						y: this.scrollTop
					},
					1
				)
			}
		},

		computed: {
			isGroupOwner() {
				if (this.thread.type == 1) {
					const ownerId = this.thread.groupOwnerId
					return ownerId == this.$store.state.User.accountInfo.userId
				} else {
					return false
				}
			},

			isGroupManager() {
				if (this.thread.type == 1) {
					const myInfo = this.$store.getters['MyGrounp/groupUserInfo'](this.thread.id, this.$store.state.User.accountInfo.userId)
					// console.log('myInfo', myInfo)
					return myInfo.adminFlag != 0
				} else {
					return false
				}
			},

			bannedTime() {
				if (this.thread.type != 1 || this.isGroupManager) return ''
				const myID = this.$store.state.User.accountInfo.userId
				const myInfo = this.$store.getters['MyGrounp/groupUserInfo'](this.thread.id, myID)
				// console.log('禁言相关数据：', this.thread, myInfo)
				if (this.thread.bannedSpeech == 1) { // 全员禁言
					// 如果开启匿名聊天，则不论如何，全体禁言
					if (this.thread.isAnoymous == 1) {
						return 'ever'
					}

					if (myID == this.thread.groupOwnerId || (myInfo.allowedSpeech == 1 && myInfo.bannedSpeech != 1)) {
						// 如果自己是群主或者在可发言列表里，则可发言
						return ''
					} else if (myInfo.bannedSpeech == 1) {
						// 如果在不可发言列表，则根据不可发言列表的禁言时间禁言
						const leftTime = `${new Date(myInfo.bannedTime).getTime() - this.$utils.fun.getServerTime('bannedTime1')}`
						if (leftTime > 0) {
							return leftTime
						} else if (myInfo.allowedSpeech == 1) {
							return ''
						} else {
							return 'ever'
						}
					}

					return 'ever'
				} else if (myInfo.bannedSpeech == 1) { // 被设置禁言
					// 如果开启匿名聊天，则允许发言
					if (this.thread.isAnoymous == 1) {
						return ''
					}

					const leftTime = `${new Date(myInfo.bannedTime).getTime() - this.$utils.fun.getServerTime('bannedTime2')}`
					return leftTime > 0 ? leftTime : 'banned'
				} else {
					return ''
				}
			},

			isLocked() {
				if (this.thread) {
					return this.thread.type == 1 && this.thread.state == 0
				} else {
					return false
				}
			},

			thread() {
				return this.$store.getters['Chat/currentThread']
			},

			clientFileMaxSize() {
				return parseInt(this.$store.state.Setting.paramsConfig && this.$store.state.Setting.paramsConfig.clientFileMaxSize) || 20
			},

			chatToMyself() {
				return this.thread.userId == this.$store.state.User.accountInfo.userId
			},

			messages() {
				return this.$store.state.Chat.messages
			},

			messageCount() {
				const newCount = this.messages ? this.messages.length : 0
				if (newCount > 0) {
					this.$nextTick(() => {
						let scrollable = false
						if (this.$refs.bubbles) {
							const scrollHeight = this.$refs.bubbles.$refs.scrollContent.scrollHeight
							scrollable = scrollHeight > this.$refs['messageList'].clientHeight
						}

						// 消息不足一页的时候，无法造成滚动，也就无法懒加载，得手动更新视野范围内的消息
						if (!scrollable && newCount <= 10) {
							this.messagesInView = this.messages.map(msg => {
								return msg.originID
							})
						}
					})
				}
				return newCount
			},

			groupMembers() {
				if (this.thread.type != 1 || this.thread.latestStatus != '8') return []
				const groupMembers = this.$store.getters.groupUsers(
					this.thread.id,
					this.thread.groupOwnerId
				)
				this.onlineCount = groupMembers.filter(member => {
					return member.onlineState == 1
				}).length
				return groupMembers
			}
		},

		watch: {
			$route(to, from) {
				// 当从消息以外的页面回来时，若当前会选中的会话有未读数，则归零。否则离开当前会话的时候，未读数就显示了。
				if (from.path != '/chat' && this.thread && this.thread.unreadCount > 0) {
					this.$store.dispatch('Chat/updateThread', {
						threadID: this.thread.id,
						updatingData: { unreadCount: 0 }
					})
					// 设置系统消息已读
					if (this.thread.id === 'notify' && this.thread.unreadCount > 0) {
						this.$utils.api.message.readAllNotify().get()
					}
					// 设置积分助手消息已读
					if (this.thread.id === 'point' && this.thread.unreadCount > 0) {
						this.$utils.api.message.readAllPointNotify().get()
					}
				}
			},
			messagesInView(val) {
				if (val.length > 0) {
					const updatingIDs = []
					const readIDs = [] // 非触发类型的消息
					let include_firstAtMe = false
					let include_firstNewMsg = false
					let include_firstUnreadMsg = false

					let msgID
					val.forEach(originID => {
						const msg = this.$store.getters['Chat/someMessage'](originID)
						if (msg) {
							msgID = msg.id
							if (!msg.isSend && msg.read == 0) {
								// 如果不是阅后即焚或者语音消息则更新为已读
								updatingIDs.push(msgID)
								if (
									msg.burntAfterRead != 1 &&
									![this.$CHAT_MSG_TYPE.TYPE_VOICE,
										this.$CHAT_MSG_TYPE.TYPE_FILE,
										this.$CHAT_MSG_TYPE.TYPE_VIDEO
									].includes(msg.cForm)
								) {
									readIDs.push(msgID)
								}
							}
							// 是否包含第一个@我
							if (this.firstAtMe && msgID == this.firstAtMe) include_firstAtMe = true
							// 是否包含第一条新消息
							if (this.firstNewMsg && msgID == this.firstNewMsg) include_firstNewMsg = true
							// 是否包含第一条未读消息
							if (this.firstUnreadMsg && msgID == this.firstUnreadMsg) include_firstUnreadMsg = true
						}
					})

					if (!this.$store.state.Chat.preloading) {
						// 更新快速定位浮标
						if (include_firstAtMe) this.firstAtMe = ''
						if (include_firstNewMsg) { this.firstNewMsg = ''; this.newMsgCount = 0 }
						if (include_firstUnreadMsg) this.firstUnreadMsg = ''
					}

					// 更新已读
					if (updatingIDs.length > 0) {
						this.$store.dispatch('Chat/updateMsg', {
							ids: updatingIDs,
							readIDs,
							updatingData: {
								read: 1
							}
						})
					}
				}
			},
			messageCount(newCount, oldCount) {
				if (newCount > oldCount && oldCount == 0) {
					if (this.$store.state.Chat.preloading) {
						setTimeout(() => {
							if (this.$store.state.Chat.preloading) {
								if (this.$store.state.Chat.scrollTo.id) {
									this.onMessageListResize()
								} else {
									this.scrollToEnd()
								}

								this.$store.commit('Chat/updatePreloading', false)
								if (!this.moveSelected) {
									this.moveSelected = this.$refs.moveSelected
									this.moveSelectedRect = this.moveSelected.getBoundingClientRect()
									this.messageListRect = this.$refs.messageList.getBoundingClientRect()
								}
							}
						}, 300)
					}

					// 进入会话时处理未读数据
					this.$nextTick(() => {
						if (this.thread.unreadCount > 0) {
							// 当前聊天窗口可视范围内能容纳的消息数
							const messageCountInView = this.$refs.bubbles.getCurrentviewDom().length
							const updatingData = {
								unreadCount: 0,
								firstAtMeID: '',
								firstAtMeTime: '',
								firstUnreadID: '',
								firstUnreadTime: ''
							}

							let firstAtMe// @我的第一条信息
							if (this.thread.type == 1 && this.thread.firstAtMeID) {
								firstAtMe = this.thread.firstAtMeID
								const indexOf_firstAtMe = this.messages.findIndex(msg => {
									return msg.id == firstAtMe
								})
								// 如果第一条@我的消息在可视范围内，则不显示【有人@我】导航
								this.firstAtMe = (firstAtMe && (this.messages.length - indexOf_firstAtMe) > messageCountInView) ? firstAtMe : ''
							}

							// 未读的第一条信息
							if (!this.firstAtMe && this.thread.firstUnreadID) {
								if (this.thread.unreadCount > 10) {
									this.firstUnreadMsg = this.thread.firstUnreadID
									this.unreadCount = this.thread.unreadCount
								}
							}

							const systemThreadTypes = {
								'notify': -1,
								'point': -2
							}
							// 同步未读数
							this.$utils.chatSdk.cMsgToSelfAsync('UpdateUnread', JSON.stringify({
								groupType: systemThreadTypes[this.thread.id] || this.thread.type,
								groupId: ['notify', 'point'].includes(this.thread.id) ? '' : this.thread.id,
								clientType: process.env.webConfig.client_type
							}))

							// 设置系统消息已读
							if (this.thread.id === 'notify' && this.thread.unreadCount > 0) {
								this.$utils.api.message.readAllNotify().get()
							}
							// 设置积分助手消息已读
							if (this.thread.id === 'point' && this.thread.unreadCount > 0) {
								this.$utils.api.message.readAllPointNotify().get()
							}

							this.$store.dispatch('Chat/updateThread', { threadID: this.thread.id, updatingData })
						}
					})
				}
			},
			'$store.state.Chat.scrollTo'(val) {
				if (val.id && val.threadID == this.thread.id) {
					const scrollToID = val.id
					if (scrollToID && this.messages.length > 0 && this.messages.some(msg => {
						return msg.id == scrollToID
					})) {
						this.$refs.bubbles.scrollIntoView(`#msg${scrollToID}`, 0)
						this.scrollTarget = scrollToID
					}
				} else {
					this.scrollTarget = ''
				}
			},
			'$store.state.Setting.windowsVisibility'(val) {
				if (val && this.thread) { // 界面唤醒时
					// 聊天设置窗口的的动画效果恢复
					this.setupAnimate = true
					// 当前会话未读数归零
					if (this.thread.unreadCount > 0) {
						this.$store.dispatch('Chat/updateThread', {
							threadID: this.thread.id,
							updatingData: { unreadCount: 0 }
						})
					}
					// 更新消息状态
					this.updateMessageStatus()
				} else {
					// 后台运行隐藏群设置
					this.setupAnimate = false
					this.showThreadSetup = false
					this.showReplyDetail = false
				}
			},
			'thread.latestStatus'(val) {
				if (this.thread.type == 1 && val != '8') {
					this.showThreadSetup = false
				}
			},
			'$store.state.Chat.currentThreadID'(to, from) {
				const fromID = from || ''
				if (fromID) {
					const fromThread = this.$store.getters['Chat/someThread'](fromID)
					if (fromThread) {
						const systemThreadTypes = {
							'notify': -1,
							'point': -2
						}
						// 同步清空未读数
						this.$utils.chatSdk.cMsgToSelfAsync('UpdateUnread', JSON.stringify({
							groupType: systemThreadTypes[fromID] || this.thread.type,
							groupId: ['notify', 'point'].includes(this.thread.id) ? '' : fromThread.id,
							clientType: process.env.webConfig.client_type
						}))

						if (fromThread.firstAtMeID) {
							this.$store.dispatch('Chat/updateThread', {
								threadID: fromThread.id,
								updatingData: {
									firstAtMeID: '',
									firstAtMeTime: ''
								}
							})
						}
					}

					this.resetSelected()
					this.init()
				}
			}
		},

		methods: {
			scrollToFirstAtMe() {
				this.$refs.bubbles.scrollIntoView(`#msg${this.firstAtMe}`, 100)
				this.firstAtMe = ''
			},
			msgUpdate(data) {
				if (data.mType && data.mType == 'tip_withdraw') {
					this.withdrawMsgs.push(data.id)
					if (this.replyTarget.id && this.withdrawMsgs.includes(this.replyTarget.id)) {
						this.replyTarget = {}
					}
				}
			},
			hideChatRecord() {
				this.chatRecordInfo = {}
			},
			hideReplyDetail() {
				this.showReplyDetail = false
				setTimeout(() => {
					this.replyInfo = {}
				}, 300)
			},
			msgWithdraw(message) {
				if (message.isSend == 0) {
					this.withdrawTarget = message
					this.preWithdraw = true
				} else {
					this.withdraw(message)
				}
			},

			cancelWithdraw() {
				if (this.withdrawing) {
					this.withdrawing = false
				}
				this.preWithdraw = false
				setTimeout(() => {
					this.withdrawTarget = null
				}, 300)
			},

			showUserCard(userId) {
				let notAllowAddme = 0
				let isGroupMember = true
				if (this.thread.type == 1) {
					const userInfo = this.$store.getters['MyGrounp/groupUserInfo'](
						this.thread.id,
						userId
					)

					if (userInfo.userId) {
						notAllowAddme = userInfo.notAllowAddme
					} else {
						isGroupMember = false
					}
				}

				const isMyFriend = this.$store.state.MyFriend.list.some(friend => {
					return friend.userId == userId
				})

				if (
					notAllowAddme == 1 &&
					userId != this.$store.state.User.accountInfo.userId &&
					!isMyFriend
				) {
					this.$message.warn(this.$t('chat.personalInformation'))
					if (this.chatRecordInfo) {
						this.chatRecordInfo = {}
					}
					return
				}

				this.$store.dispatch('OPcomponent/set_userCard', {
					userId,
					privacyProtection: isGroupMember && !this.isGroupManager && this.thread.privacyProtection == 1 && !isMyFriend
				})
			},

			makeFriend() {
				const friendInfo = this.thread
				if (friendInfo.isOnBlacklist == 1) {
					this.removingUserId = friendInfo.userId
					this.removingText = this.$t('chat.blacklistOp[0]', { name: friendInfo.label || friendInfo.name })
					this.preRemovingFromBlackList = true
				} else {
					this.$store.dispatch('OPcomponent/set_userCard', {
						userId: friendInfo.userId,
						firstModal: 'addMask'
					})
				}
			},

			async removeFromBlackList() {
				this.removingFromBlackList = true
				await this.$utils.api.user.deleteBlackUser({ blacklistUserId: this.removingUserId }).get()

				this.removingText = ''
				this.removingFromBlackList = false
				this.preRemovingFromBlackList = false

				this.$nextTick(() => {
					this.$store.dispatch('OPcomponent/set_userCard', {
						userId: this.removingUserId,
						firstModal: 'addMask'
					})
					this.removingUserId = ''
				})
			},

			updateReplyTarget() {
				this.replyInfo.updateTime = this.$utils.fun.getServerTime('updateReplyTarget')
			},
			handleDragend() {
				console.log('handleDragend')
			},
			handleDragleave() {
				console.log('handleDragleave')
			},
			handleDragover() {
				console.log('handleDragover')
			},
			handleDrop(e) {
				console.log('handleDrop')
				this.$refs.editor.handleDrop(e.dataTransfer.files)
			},
			onMessageListResize(e) {
				// 如果存在滚动高度，滚动到之前的位置
				if (this.scrollH >= 0) {
					this.$refs.bubbles.scrollBy(
						{
							dy: this.$refs.bubbles.$refs.scrollContent.scrollHeight - this.scrollH
						},
						0
					)
					this.scrollH = -1
				} else {
					const scrollToID = this.$store.state.Chat.scrollTo.id
					if (scrollToID && this.thread.id == this.$store.state.Chat.scrollTo.threadID && this.messages.length > 0 && this.messages.some(msg => {
						return msg.id == scrollToID
					})) {
						this.$refs.bubbles.scrollIntoView(`#msg${scrollToID}`, 0)
						this.scrollTarget = scrollToID
						if (this.$store.state.Chat.preloading) {
							this.$store.commit('Chat/updatePreloading', false)
						}
					} else if (!scrollToID) {
						const curMsgCount = this.messages.length// 当前消息数
						const curLastMsg = window._.last(this.messages) || {}// 当前最后一条消息

						// 消息数为0，重置未读/新消息/有人@我
						if (curMsgCount == 0) {
							this.firstUnreadMsg = ''
							this.firstNewMsg = ''
							this.firstAtMe = ''
						}

						// 收到新消息
						if (curMsgCount > this.lastMsgCount && curLastMsg.id != this.lastMessageID) {
							// 首次获取消息，直接滚动到底部
							if (this.lastMsgCount == 0) {
								this.lastMsgCount = curMsgCount
								this.lastMessageID = curLastMsg.id
								this.scrollToEnd()
								return
							}

							this.lastMsgCount = curMsgCount
							this.lastMessageID = curLastMsg.id

							if (curLastMsg.isSend == 1) {
								this.scrollToEnd()
								// 如果是发送消息直接滚动到底部
								if (!this.messagesInView.includes(curLastMsg.originID)) {
									this.messagesInView.push(curLastMsg.originID)
								}
							} else if (this.isAtBottom(true)) {
								// 如果在底部，滚动到底部
								this.scrollToEnd()
							} else {
								// 如果不在底部,新消息提醒
								if (this.$store.state.Setting.windowsVisibility && curLastMsg.read == 0) {
									this.newMsgCount += 1
									if (!this.firstNewMsg) {
										this.firstNewMsg = curLastMsg.id
									}
								}
							}
						} else if (curMsgCount < this.lastMsgCount) {
							this.lastMsgCount = curMsgCount
							this.lastMessageID = curLastMsg.id || ''
						} else if (curMsgCount == this.lastMsgCount && this.isAtBottom(false)) {
							this.scrollToEnd()
						}
					}
				}
			},

			// 是否在底部
			isAtBottom(getNew = true) {
				let lastMsg = this.messages[this.messages.length - 2] || null
				if (!getNew) {
					lastMsg = this.messages[this.messages.length - 1] || null
				}
				if (!lastMsg) return true
				return this.messagesInView.includes(lastMsg.originID)
			},

			bubbleTriger(e) {
				const form = e.form
				if (form == this.$CHAT_MSG_TYPE.TYPE_NOTE) {
					this.collectionData = e
					this.$refs.collectionModel.visible = true
				} else if (form == this.$CHAT_MSG_TYPE.TYPE_REPLY) {
					this.replyInfo = e.data
					this.showReplyDetail = true
				}
			},

			_handleRealAudio() {
				if (!this.onlineCheck()) return
				if (this.$store.state.OPcomponent.hasRealCall) {
					this.$message.error('当前正在通话中')
					return
				}
				const { nickName, userAvatar, userId: senderId } = this.$store.state.User.accountInfo
				console.log('this.$store.state.User.accountInfo:::', this.$store.state.User.accountInfo)
				const { id, userId } = this.thread
				const userInfo = this.$store.getters['User/userInfo'](userId)
				const friendInfo = this.$store.getters['MyFriend/friendInfo'](userId)
				const name = friendInfo.label || userInfo.nickName
				const avatar = userInfo.userAvatar
				this.$utils.fun.createWin({
					action: 'openRealAudioWin',
					params: {
						cForm: this.$CHAT_MSG_TYPE.TYPE_REALAUDIO_REQUEST,
						userName: name,
						userAvatar: avatar,
						threadId: id,
						meta: { // 发送者
							userId: senderId,
							nickName,
							userAvatar,
							groupType: 0,
							clientType: process.env.webConfig.client_type
						},
						isSend: true
					}
				})
			},
			...mapActions({
				sendMessage(dispatch, msg) {
					dispatch('Chat/sendMessage', {
						msg,
						thread: this.thread
					}).catch(e => {
						this.$message.error(e.message)
					})
				},
				resendMessage(dispatch, message) {
					dispatch('Chat/resendMessage', { thread: this.thread, message })
				},
				// 删除记录方法
				delMsgFun(dispatch) {
					if (!this.$store.state.Setting.online) {
						this.$message.error(this.$t('common.netErrorTip[0]'))
						this.resetSelected()
						this.preDelMsg = false
						return
					}
					const ids = this.selectedList.map(id => {
						return id.split('msg')[1]
					})
					dispatch('Chat/delMsg', {
						threadID: this.thread.id,
						ids
					})
					this.resetSelected()
					this.preDelMsg = false
				}
			}),
			fileSelect() {
				this.$refs.editor.$refs.fileSelect.click()
			},

			// 撤回
			async withdraw(message) {
				if (!this.onlineCheck()) {
					this.preWithdraw = false
					return
				}
				this.withdrawing = true
				const isGroupOwner = this.isGroupManager ? 1 : (this.isGroupManager ? 2 : 0)
				const res = await this.$store.dispatch('Chat/withdraw', Object.assign({
					groupId: this.thread.id,
					action: this.thread.type + 1,
					isGroupOwner
				}, message ? {
					messageId: message.id,
					messageTimestamp: message.timeStr || message.timestamp,
					messageUserId: message.senderID
				} : {}))

				if (res) {
					if (res.code == 2024) {
						this.$message.error(this.$t('chat.turnOffFeature'))
					} else if (!isGroupOwner && res.code == 2011) {
						this.$message.error(this.$t('chat.removeGroupChat[0]'))
					} else if (res.code == 2013) { // 消息不存在
						await this.$store.dispatch('Chat/delMsg', {
							threadID: this.thread.id,
							ids: [message.id]
						})
					} else if (res.code === 2010) { // 对方解除了好友关系
						await this.$store.dispatch('Chat/clearMsg', { threadID: this.thread.id })
					} else if (res.code === 5002) {
						this.$message.error(this.$t('common.netErrorTip[0]'))
					}
				}

				this.cancelWithdraw()
			},

			// 多选
			multiSelect(msgID) {
				this.selectedList.push(msgID)
				this.selectable = true
			},

			// 过滤转发信息 mergeSharingMessages:true合并转发，false逐条转发
			async preShareMsgs(mergeSharingMessages) {
				if (!this.onlineCheck()) return
				if (this.selectedList.length > 0) {
					if (mergeSharingMessages) {
						this.mergeSharingMessages = true
					}

					let existSpecialMsg = false
					for (let i = 0; i < this.selectedList.length; i++) {
						existSpecialMsg = this.messages.some(msg => {
							return (
								msg.id == this.selectedList[i].substr(3) &&
								([this.$CHAT_MSG_TYPE.TYPE_VOICE, this.$CHAT_MSG_TYPE.TYPE_LOCATION, 77, 78].includes(msg.cForm) || // 语音,收发红包
									(mergeSharingMessages && msg.cForm == this.$CHAT_MSG_TYPE.TYPE_CHATRECORD) || // 聊天记录
									msg.burntAfterRead == 1 || // 接收的阅后即焚消息
									msg.status != 1) // 发送中、发送失败
							)
						})
						if (existSpecialMsg) {
							break
						}
					}
					const msgUrlArray = []
					for (let i = 0; i < this.selectedList.length; i++) {
						this.messages.forEach(msg => {
							if (msg.id == this.selectedList[i].substr(3) &&
								msg.cForm !== this.$CHAT_MSG_TYPE.TYPE_VOICE && msg.url) {
								msgUrlArray.push(msg.url)
							}
						})
					}
					if (msgUrlArray.length > 0) {
						const msgUrlExist = await this.$utils.chatSdk.cExistsUploadAsync(msgUrlArray.join(','))
						if (msgUrlExist.code === 0) {
							msgUrlExist.data.forEach(item => {
								if (item.exists) this.serverFileExistList.push(item.uri)
							})
						}
					}
					if (existSpecialMsg || this.serverFileExistList.length !== msgUrlArray.length) { // 服务器可用文件与msgurlarray长度不同，说明有文件过期
						this.sharingSpecialMsgs = true
					} else {
						this.shareMsgs()
					}
				} else {
					this.$message.error(this.$t('chat.forwardTip[0]'))
				}
			},

			// 多条转发
			async shareMsgs() {
				// 过滤语音、聊天记录等特殊消息
				const sharingMsgs = this.messages.filter(msg => {
					return (
						window._.indexOf(this.selectedList, `msg${msg.id}`) > -1 &&
						(![this.$CHAT_MSG_TYPE.TYPE_VOICE, this.$CHAT_MSG_TYPE.TYPE_LOCATION, 77, 78].includes(msg.cForm) &&
							!(this.mergeSharingMessages && msg.cForm === this.$CHAT_MSG_TYPE.TYPE_CHATRECORD) &&
							msg.burntAfterRead != 1 &&
							msg.status === 1)
					)
				})

				if (sharingMsgs.length > 0) {
					this.sharingSpecialMsgs = false
					this.selectable = false
					this.sharingMessages = sharingMsgs
					this.selectingFriends = true
				} else {
					this.sharingSpecialMsgs = false
					this.selectable = false
					this.selectedList = []
					this.serverFileExistList = []
					this.mergeSharingMessages = false
				}
			},

			// 转发
			async share(message) {
				if (!this.onlineCheck()) return
				let fileExist = true
				let fileUrlExist = false
				if (message.url && message.mType !== 'link') { // 排除链接
					fileUrlExist = await this.$utils.chatSdk.cExistsUploadAsync(message.url)
					fileUrlExist = fileUrlExist.code === 0 && fileUrlExist.data[0].exists
					const fileLocalExist = await this.$utils.fun.fileExist(message.localPath || '')
					fileExist = fileUrlExist || fileLocalExist
				}
				if (message.status != 1 || !fileExist) {
					this.sharingSpecialMsgs = true
					return
				}
				if (message.url && fileUrlExist) this.serverFileExistList = [message.url]
				this.selectingFriends = true
				this.sharingMessages = [message]
			},

			cancelSelectFriend() {
				this.mergeSharingMessages = false
				this.selectingFriends = false
				this.sharingMessages = []
				this.selectedList = []
				this.msg_for_share = ''
				this.serverFileExistList = []
			},

			async onSelectedFriends(groups) {
				if (!this.onlineCheck()) return

				// 如果是单条转发，且转发的消息已经被撤回
				if (this.sharingMessages.length === 1 && this.withdrawMsgs.includes(this.sharingMessages[0].id)) {
					this.cancelSelectFriend()
					this.$message.error(this.$t('common.failedAndTryLater'))
					return
				}

				if (this.msg_for_share.trim().length > 2000) {
					this.$message.error(this.$t('chat.sendTip[2]'))
					return
				}

				this.selectingFriends = false
				this.selectedList = []
				let merge = null
				if (this.mergeSharingMessages) {
					this.mergeSharingMessages = false
					merge = {
						type: this.thread.type,
						name: this.thread.name || '',
						userId: this.thread.userId || ''
					}
				}
				if (this.msg_for_share) {
					this.sharingMessages.push({
						cForm: this.$CHAT_MSG_TYPE.TYPE_TEXT,
						text: this.msg_for_share,
						msg_for_share: true, // 转发留言
						data: {}
					})
					this.msg_for_share = ''
				}
				const tempSharingMessage = window._.assign([], this.sharingMessages)
				this.sizeTipMessage = []
				this.sharingMessages = tempSharingMessage.filter(item => {
					/* 兼容旧版本数据写法，暂时去掉
					if (item.data) {
						if (item.fileSize && (item.fileSize / (1024 * 1024) > this.clientFileMaxSize)) {
							this.sizeTipMessage.push({
								name: item.fileName,
								size: this.$root.$options.filters.formatBytes(item.fileSize)
							})
							return false
						} else {
							return true
						}
					} else {
						return true
					}*/
					if (item.fileSize && (item.fileSize / (1024 * 1024) > this.clientFileMaxSize)) {
						this.sizeTipMessage.push({
							name: item.fileName,
							size: this.$root.$options.filters.formatBytes(item.fileSize)
						})
						return false
					} else {
						return true
					}
				})
				if (this.sizeTipMessage.length) {
					this.sizeTipVisible = true
				}
				this.$store.dispatch('Chat/relayMessage', { messages: this.sharingMessages, groups, merge, serverFileExistList: this.serverFileExistList }).then(res => {
					// this.$message.success('转发成功')
					this.serverFileExistList = []
				}).catch(e => {
					console.log(e)
					this.serverFileExistList = []
					// this.$message.error(e.message)
				})
				// 以下是没有转发接口前的转发，留着备用
				/* const sharingMessages = await this.formatSharingMessages(
					this.sharingMessages,
					this.mergeSharingMessages
				)*/
				/* let friend
				let targetThread
				for (let i = 0; i < groups.length; i++) {
					friend = groups[i]
					// 如果不存在会话，先创建
					targetThread = this.$store.getters['Chat/someThread'](friend.groupId)
					if (!targetThread) {
						const res = await this.$store.dispatch('Chat/createThread', {
							threadID: friend.groupId,
							threadType: friend.groupUsers ? 1 : 0
						})
						if (res && res.code != 0) {
							this.$message.error('转发异常')
						}
					} else if (targetThread.hidden != 0) {
						// 如果消息所属会话隐藏，则显示
						await this.$store.dispatch('Chat/updateThread', {
							threadID: friend.groupId,
							updatingData:{hidden: 0}
						})
					}
				}*/
				/* for (let i = 0; i < groups.length; i++) {
					friend = groups[i]
					// 如果不存在会话，先创建
					targetThread = this.$store.getters['Chat/someThread'](friend.groupId)
					if (!targetThread) {
						console.log(friend)
						const res = await this.$store.dispatch('Chat/createThread', {
							threadID: friend.groupId,
							threadType: friend.groupUsers ? 1 : 0
						})
						if (res && res.code != 0) {
							this.$message.error('转发异常')
						}
						targetThread = this.$store.getters['Chat/someThread'](friend.groupId)
					} else if (targetThread.hidden != 0) {
						// 如果消息所属会话隐藏，则显示
						await this.$store.dispatch('Chat/updateThread', {
							threadID: friend.groupId,
							updatingData:{hidden: 0}
						})
					}

					const itemsIDs = {}
					const msgCount = sharingMessages.length - 1
					targetThread = this.$store.getters['Chat/someThread'](friend.groupId)
					for (let j = 0; j <= msgCount; j++) {
						// 如果是合并转发消息
						if (
							j == msgCount &&
							sharingMessages[j].text &&
							sharingMessages[j].text.items
						) {
							sharingMessages[j].text.items = sharingMessages[j].text.items.map(
								item => {
									item.msgId = itemsIDs[`${item.msgId}`]
									return item
								}
							)
						}
						const res = await this.$store.dispatch('Chat/sendMessage', {
							msg: sharingMessages[j],
							thread: targetThread
						})

						if (res && res.code != 0) {
							hasError = true
						} else if (j < msgCount && res && res.originID) {
							itemsIDs[`${res.originID}`] = res.newID
						}
					}

					if (this.msg_for_share) {
						const res2 = await this.$store.dispatch('Chat/sendMessage', {
							msg: {
								text: this.msg_for_share
							},
							thread: targetThread
						})

						if (res2 && res2.code != 0) {
							hasError = true
						}
					}
				}*/
			},

			// formatSharingMessages(messages, merge) {
			// 	return new Promise(async(resolve, reject) => {
			// 		let msg
			// 		let formatedMsgs = []

			// 		for (let i = 0; i < messages.length; i++) {
			// 			const { id, cForm, atUsers, text, data, mType } = messages[i]
			// 			msg = { atUsers, cForm }

			// 			if (cForm == 101) {
			// 				msg.text = text
			// 			} else if (cForm == 109) {
			// 				msg.text = data
			// 			} else {
			// 				msg.files = true
			// 				msg.data = data
			// 			}
			// 			msg.id = `${id}`

			// 			if (mType == 'chatRecord') {
			// 				const ids = text.items.map(record => {
			// 					return record.originID
			// 				})
			// 				formatedMsgs = formatedMsgs.concat(
			// 					await this.formatSharingMessages(
			// 						(await this.$utils.sqlite.getChatData({
			// 							where: `id in ('${ids.join(',').replace(/,/g, "','")}')`,
			// 							order: 'timestamp DESC'
			// 						})).reverse(),
			// 						true
			// 					)
			// 				)
			// 			} else {
			// 				formatedMsgs.push(msg)
			// 			}
			// 		}

			// 		resolve(formatedMsgs)
			// 	})
			// },

			init() {
				// 初始化相关字段
				window._.assign(this.$data, {
					withdrawMsgs: [], // 被撤回的消息

					reEditData: { id: '' },

					scrollTarget: '',

					preRemovingFromBlackList: false,
					removingText: '',
					removingFromBlackList: false,
					removingUserId: '',

					lastMsgCount: 0,
					lastMessageID: '', // 记录当前最后一条消息时间，用于判断是否有新消息插入，触发onMessageListResize时可用于控制页面滚动

					sizeTipVisible: false,
					sizeTipMessage: [],
					serverFileExistList: [], // 文件过期数组
					onlineCount: 0,

					replyTarget: {},
					replyInfo: {},

					setupAnimate: true,
					showThreadSetup: false,
					showReplyDetail: false,
					showThreadFile: false,
					moveSelected: null,
					oldLeft: 0,
					oldTop: 0,
					dragFlag: false,
					isMouseMove: false,
					selectedList: [],
					selectable: false,

					preSendUserCard: false,

					readStatusListData: {},

					collectionData: {},

					chatRecordInfo: {},

					mergeSharingMessages: false,
					sharingSpecialMsgs: false,
					msg_for_share: '',

					preWithdraw: false,
					withdrawing: false,
					withdrawTarget: null,

					preDelMsg: false,
					deletingMsg: false,

					selectingFriends: false,
					sharingMessages: null,

					unreadCount: 0,
					newMsgCount: 0,
					firstUnreadMsg: '',
					firstNewMsg: '',
					firstAtMe: '',

					scrollH: -1, // 滚动条高度
					scrollTop: 0, // 滚动条位置
					loadingMessage: false, // 拉取消息中
					nomore: false, // 消息拉取完毕
					nomoreLocalData: false, // 本地消息拉取完毕

					messagesInView: [],
					scrollTimeoutID: ''
				})

				if (this.$refs.moveSelected) {
					this.moveSelected = this.$refs.moveSelected
					this.moveSelectedRect = this.moveSelected.getBoundingClientRect()
					this.messageListRect = this.$refs.messageList.getBoundingClientRect()
				}
			},

			async onScroll(vertical) {
				// 滚动结束后，若进入可视范围的消息未读，则设置为已读（阅后即焚等需要用户主动触发）
				if (this.scrollTimeoutID) {
					clearTimeout(this.scrollTimeoutID)
				}
				// 100毫秒内没有滚动，则认为滚动结束
				this.scrollTimeoutID = setTimeout(() => {
					clearTimeout(this.scrollTimeoutID)
					this.scrollTop = vertical.scrollTop
					this.updateMessageStatus()

					// 如果滚到顶部，加载更多历史消息
					// console.log(`scrollTop_${vertical.scrollTop} |`, `preloading_${this.$store.state.Chat.preloading} |`, `loadingMessage_${this.loadingMessage} |`, `nomore_${this.nomore}`)
					if (!this.$store.state.Chat.preloading && !this.loadingMessage && !this.nomore && vertical.scrollTop === 0) {
						if (this.messages.length === 0) return
						this.loadingMessage = true
						this.loadMore(
							this.messages.slice(0, this.$store.state.Chat.pageSize).reverse(),
							{
								id: this.messages[0].id,
								timestamp: this.messages[0].timestamp
							}).then(async localData => {
							if (localData.length === this.$store.state.Chat.pageSize) {
								// 数据满一页，直接更新列表
								this.scrollH = this.$refs.bubbles.$refs.scrollContent.scrollHeight
								this.$store.commit('Chat/loadMessages', { messages: localData })
							} else {
								console.log('当前会话没有更多数据了，向上滚动不再拉取')
								this.nomore = true
								const unSortedMsgs = this.$store.state.Chat.unSortedMsgs.filter(msg => {
									return msg.threadID == this.thread.id
								})
								if (unSortedMsgs.length > 0) {
									let msg
									let msgTime
									let msgTimeStr
									const sortedMsgs = []
									for (let i = 0; i < unSortedMsgs.length; i++) {
										msg = unSortedMsgs[i]
										msgTimeStr = `${msg.data.messageTimestamp}`.length > 13 ? msg.data.messageTimestamp : `${msg.data.messageTimestamp}000000`
										msgTime = new Date(Math.ceil(msgTimeStr / 1000000)).getTime()
										// await this.$utils.sqlite.updateChatData({
										// 	where: `id='${msg.id}'`,
										// 	data: {
										// 		status: 1,
										// 		timestamp: msgTime,
										// 		timeStr: msg.data.messageTimestamp
										// 	}
										// })
										await this.$store.dispatch('Chat/updateMsg', {
											id: `id='${msg.id}'`,
											updatingData: {
												status: 1,
												timestamp: msgTime,
												timeStr: msg.data.messageTimestamp
											}
										})
										sortedMsgs.push(Object.assign({}, msg, {
											status: 1,
											timestamp: msgTime,
											timeStr: msgTimeStr
										}))
									}

									this.$store.commit('Chat/updateUnSortedMsgs', {
										action: 'clear'
									})

									localData = sortedMsgs.concat(localData).sort((a, b) => {
										return b.timestamp - a.timestamp
									})
								}

								if (localData.length > 0) {
									this.scrollH = this.$refs.bubbles.$refs.scrollContent.scrollHeight
									this.$store.commit('Chat/loadMessages', { messages: localData })
								}
							}

							this.loadingMessage = false
						}).catch(e => {
							this.loadingMessage = false
						})
					}
				}, 100)
			},

			loadMore(messages, curFirstMsg) {
				return new Promise(async(resolve, reject) => {
					if (this.thread.type == 10001) {
						const nextPageData = await this.$utils.sqlite.getChatData({
							where: `threadID='${this.thread.id}' and timestamp<${curFirstMsg.timestamp} and timestamp>=${this.thread.clearTime || 0}`,
							order: 'timestamp DESC',
							size: this.$store.state.Chat.pageSize,
							index: 0
						})
						resolve(nextPageData)
					} else {
						let res = { code: 0 }
						let serverTime
						let preMsg
						// 是否存在批次交接点
						// 第一种，存在2个不一样的批次号，首个批次号即为交接点
						let indexOf_FirstsyncBatch = messages.findIndex((msg, index) => {
							preMsg = messages[index + 1]
							return msg.syncBatch !== '' && preMsg && preMsg.syncBatch != msg.syncBatch
						})
						// 第二种，最后一条数据有批次号，暂定为交接点
						if (indexOf_FirstsyncBatch < 0 && messages[messages.length - 1].syncBatch !== '') {
							indexOf_FirstsyncBatch = messages.length - 1
						}

						let nextPage = await this.$utils.sqlite.getChatData({
							where: `threadID='${this.thread.id}' and timestamp<${messages[messages.length - 1].timestamp} and timestamp>=${this.thread.clearTime || 0}`,
							order: 'timestamp DESC',
							size: this.$store.state.Chat.pageSize,
							index: 0
						})

						const firstMsgOfNextPage = nextPage[0]

						if (indexOf_FirstsyncBatch >= 0) {
							const firstSyncBatch = messages[indexOf_FirstsyncBatch]
							// 交接点前一条消息
							preMsg = messages[indexOf_FirstsyncBatch + 1]
							// 如果是第二种，前面没有消息了，则从数据库查询
							if (!preMsg) {
								preMsg = firstMsgOfNextPage
							}
							// 如果存在更早的一条消息，且批次号不一样，即确定为交接点
							if (preMsg && preMsg.syncBatch != firstSyncBatch.syncBatch) {
								// 如果本地拉取的数据包含批次交接点，则尝试从服务端补全该批次记录
								console.log('批次交接点：', firstSyncBatch, preMsg)
								serverTime = firstSyncBatch.timeStr || `${firstSyncBatch.timestamp - 1}000000`
								res = await this.loadMoreHistory({
									threadID: this.thread.id,
									time: serverTime,
									syncBatch: firstSyncBatch.syncBatch,
									preMsgID: preMsg.id
								})
							} else if (preMsg && preMsg.syncBatch == firstSyncBatch.syncBatch) {
								// 如果存在更早的一条消息，且批次号一样，则从上一页继续寻找交接点
								indexOf_FirstsyncBatch = nextPage.findIndex((msg, index) => {
									preMsg = nextPage[index + 1]
									return msg.syncBatch !== '' && preMsg && preMsg.syncBatch != msg.syncBatch
								})
								if (indexOf_FirstsyncBatch >= 0) {
									preMsg = nextPage[indexOf_FirstsyncBatch + 1]
									// 如果本地拉取的数据包含批次交接点，则尝试从服务端补全该批次记录
									console.log('批次交接点：', firstSyncBatch, preMsg)
									serverTime = firstSyncBatch.timeStr || `${firstSyncBatch.timestamp - 1}000000`
									res = await this.loadMoreHistory({
										threadID: this.thread.id,
										time: serverTime,
										syncBatch: firstSyncBatch.syncBatch,
										preMsgID: preMsg.id
									})
								}
							} else if (!preMsg) {
								// 本地没数据了，尝试去服务端拉取
								console.log('本地没数据了，并且当前批次未完结，尝试去服务器拉取')
								serverTime = messages[messages.length - 1].timeStr || `${messages[messages.length - 1].timestamp - 1}000000`
								res = await this.loadMoreHistory({
									threadID: this.thread.id,
									time: serverTime,
									syncBatch: firstSyncBatch.syncBatch
								})
							}
						} else if (!firstMsgOfNextPage) {
							// 本地没数据了，尝试去服务端拉取
							console.log('本地没数据了，尝试去服务器拉取')
							serverTime = messages[messages.length - 1].timeStr || `${messages[messages.length - 1].timestamp - 1}000000`
							res = await this.loadMoreHistory({
								threadID: this.thread.id,
								time: serverTime
							})
						}

						if (res.code != 0) {
							return reject(res)
						}

						if (indexOf_FirstsyncBatch >= 0 || !firstMsgOfNextPage) {
							// 从数据库读取下一页数据
							nextPage = await this.$utils.sqlite.getChatData({
								where: `threadID='${this.thread.id}' and timestamp<${messages[messages.length - 1].timestamp} and timestamp>=${this.thread.clearTime || 0}`,
								order: 'timestamp DESC',
								size: this.$store.state.Chat.pageSize,
								index: 0
							})
						}

						if (nextPage.length > 0 && nextPage.length < this.$store.state.Chat.pageSize && !res.nomore) {
							// 如果数据库读取的数据不足一页，且存在交接点，继续尝试从服务器补全
							nextPage = await this.loadMore(nextPage, curFirstMsg)
							resolve(nextPage)
						} else if (messages[messages.length - 1].id == curFirstMsg.id) {
							resolve(nextPage)
						} else {
							const nextPageData = await this.$utils.sqlite.getChatData({
								where: `threadID='${this.thread.id}' and timestamp<${curFirstMsg.timestamp} and timestamp>=${this.thread.clearTime || 0}`,
								order: 'timestamp DESC',
								size: this.$store.state.Chat.pageSize,
								index: 0
							})
							resolve(nextPageData)
						}
					}
				})
			},

			updateMessageStatus() {
				if (this.thread.type == 10001) return
				// 窗口最小化时不做处理
				if (!this.$store.state.Setting.windowsVisibility) return
				const messagesInView = this.$refs.bubbles.getCurrentviewDom()
				if (!messagesInView || messagesInView.length == 0) return
				this.messagesInView = messagesInView.map(msg => {
					return msg.attributes['origin-id'].value
				})
			},

			// 批量删除
			delMsg() {
				if (!this.selectedList.length) {
					this.$message.warning('请选择要删除的记录')
					return
				}
				this.preDelMsg = true
			},
			exitTool() {
				this.selectable = false
				this.selectedList = []
			},
			scrollToEnd() {
				this.$refs.bubbles.scrollTo(
					{
						y: '100%'
					},
					1
				)
			},
			mouseDown(event) {
				if (this.thread.type === 10001) return
				this.dragFlag = true
				this.isMouseMove = false
				this.moveSelected.style.top = event.pageY - this.moveSelectedRect.top + this.$refs.messageList.scrollTop + 'px'
				this.moveSelected.style.left = event.pageX - this.moveSelectedRect.left + 'px'
				this.oldLeft = event.pageX
				this.oldTop = event.pageY
			},
			mouseMove(event) {
				if (this.thread.type === 10001) return
				if (!this.dragFlag) return // 只有开启了拖拽，才进行mouseover操作
				this.moveSelected.style.visibility = 'visible'
				if (event.pageX < this.oldLeft) {
					// 向左拖
					this.moveSelected.style.left = event.pageX - this.moveSelectedRect.left + 'px'
					this.moveSelected.style.width = this.oldLeft - event.pageX + 'px'
				} else {
					this.moveSelected.style.width = event.pageX - this.oldLeft + 'px'
				}
				if (event.pageY < this.oldTop) {
					// 向上
					this.moveSelected.style.top = event.pageY - this.moveSelectedRect.top + this.$refs.messageList.scrollTop + 'px'
					this.moveSelected.style.height = this.oldTop - event.pageY + 'px'
				} else {
					this.moveSelected.style.height = event.pageY - this.oldTop + 'px'
				}
				if (this.moveSelected.style.height.replace('px', '') > 5 && this.moveSelected.style.width.replace('px', '') > 5) {
					this.isMouseMove = true
				}
			},
			mouseUp(event) {
				if (this.thread.type === 10001) return
				this.moveSelected.style.bottom = Number(this.moveSelected.style.top.replace('px', '')) + Number(this.moveSelected.style.height.replace('px', '')) + 'px'
				this.moveSelected.style.right = Number(this.moveSelected.style.left.replace('px', '')) + Number(this.moveSelected.style.width.replace('px', '')) + 'px'
				this.findSelected()
				this.dragFlag = false
				this.isMouseMove = false
				this.clearDragData()
			},
			mouseLeave(event) {
				if (this.thread.type === 10001) return
				this.dragFlag = false
				this.moveSelected.style.width = 0
				this.moveSelected.style.height = 0
				this.moveSelected.style.top = 0
				this.moveSelected.style.left = 0
				this.moveSelected.style.visibility = 'hidden'
			},
			findSelected() {
				if (!this.dragFlag) return
				// 获取可视的泡泡
				const blockList = this.$refs.bubbles.getCurrentviewDom()
				for (let i = 0; i < blockList.length; i++) {
					const moveSelectedLeft = Number(this.moveSelected.style.left.replace('px', ''))
					const moveSelectedRight = Number(this.moveSelected.style.right.replace('px', ''))
					const moveSelectedTop = Number(this.moveSelected.style.top.replace('px', ''))
					const moveSelectedBottom = Number(this.moveSelected.style.bottom.replace('px', ''))
					const { top, left, width, height } = blockList[i].getBoundingClientRect()
					const blockTop = top < 0 ? 0 : (top - this.messageListRect.top)
					const blockLeft = left - this.messageListRect.left
					const blockRight = left + width
					const blockBottom = top < 0 ? blockTop + height + top - this.messageListRect.top : blockTop + height
					if (blockRight < moveSelectedLeft || blockLeft > moveSelectedRight || blockBottom < moveSelectedTop || blockTop > moveSelectedBottom) {
					} else {
						const messageId = blockList[i].id
						const index = this.selectedList.indexOf(messageId)
						if (this.isMouseMove) {
							if (index === -1 && !/tip/.test(messageId)) this.selectedList.push(messageId)
						} else if (this.selectable) {
							if (index > -1) {
								this.selectedList.splice(index, 1)
							} else if (!/tip/.test(messageId)) {
								this.selectedList.push(messageId)
							}
						}
					}
				}
				if (this.selectedList.length) this.selectable = true
			},
			resetSelected() {
				this.clearDragData()
				this.selectable = false
				this.selectedList = []
				this.dragFlag = false
			},
			clearDragData() {
				if (!this.moveSelected) return
				this.moveSelected.style.width = 0
				this.moveSelected.style.height = 0
				this.moveSelected.style.top = 0
				this.moveSelected.style.left = 0
				this.moveSelected.style.bottom = 0
				this.moveSelected.style.right = 0
				this.moveSelected.style.visibility = 'hidden'
			}
		}
	}
</script>

<style lang="scss">
  #current_chat {
    // 解决关闭按钮在modal关闭后依然显示的问题
    .zoom-leave .ant-modal-close {
      display: none;
    }

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

  }
</style>
<style lang="scss">
	#content{
		.__view{
			overflow: auto;
		}
	}
</style>
<style lang="scss" scoped>
  #current_chat {
    display: flex;
    flex: 1;
    background: #f6f7f8;
    position: relative;
	  .chat-left {
		  display: flex;
		  flex: 1;
		  flex-direction: column;
		  background: #f6f7f8;
		  position: relative;
	  }
	  .chat-right{
		  width: 42px;
		  background-color: #ffffff;
		  border-left: solid 1px #e6e6e6;
		  height: 100%;
		  position: relative;
		  z-index: 21;
		  .iconfont{
			  margin: 30px auto 0;
			  font-size: 25px;
			  display: table;
			  cursor: pointer;
			  &:hover{
				  color: #2e87ff;
			  }
		  }
	  }
		.message-header{
			background:#fff;height:80px;-webkit-app-region: drag
		}
    .head-rightMenu {
      font-size: 28px;
      margin-right: 15px;
	    margin-left: 15px;
	    cursor: pointer;
	    color:#000;
      // &:last-child{margin-right: 0}
	    -webkit-app-region: no-drag
    }
    .chat-tool {
      background: #fff;
      width: 100%;
      height: 180px;
      position: absolute;
      bottom: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateY(100%);
      transition: transform 0.3s ease-out;
      &.show {
        transform: translateY(0);
      }
      .btn {
        width: 52px;
        height: 100px;
        text-align: center;
        margin-right: 45px;
        cursor: pointer;
        &:last-child {
          margin-right: 0;
          p {
            border: 0;
            background: none;
            font-size: 12px;
          }
        }
        p {
          margin-bottom: 5px;
          width: 52px;
          height: 52px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #e5e5e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          transition: background 0.3s;
          &:hover {
            background: #e5e5e5 !important;
          }
        }
        font-size: 12px;
        color: #666;
      }
    }
    .icongengduo {
      margin-right: 18px;
      cursor: pointer;
      &:hover {
        color: $darkBlue;
      }
    }
    .moveSelected {
      position: absolute;
      background-color: #ccd2ff;
      opacity: 0.3;
      border: 1px solid blue;
      top: 0;
      left: 0;
      z-index: 20;
      visibility: hidden;
    }
    #content {
      flex: 1;
      overflow: hidden;
      position: relative;
      // border-top: $border;
      border-bottom: $border;
		  &.hide{
			 visibility: hidden;
		  }

      .tip {
        font-size: 14px;
        color: rgba(153, 153, 153, 1);
        line-height: 26px;
        text-align: center;
        padding: 25px 16px 0;
        visibility: hidden;
        &.show {
          visibility: visible;
        }
      }
    }

    .has-new-msg {
      cursor: pointer;
      position: absolute;
      z-index: 21;
      right: 41px;
      bottom: 200px;
      background: #fff;
      color: #41b344;
      padding-left: 18px;
      padding-right: 8px;
      line-height: 30px;
      border: 1px solid rgba(230, 230, 230, 1);
      border-radius: 15px 0px 0px 15px;

      &.unread {
        bottom: auto;
        top: 84px;
      }

      .iconfont {
        margin-right: 7px;
        font-size: 12px;
      }
    }
  }
</style>
