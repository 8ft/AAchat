<template>
	<a-dropdown
		:trigger="['contextmenu']"
		overlayClassName="thread-list-right-menu"
		v-model="dropDownVisible"
		v-if="threadInfo.name"
	>
		<div :class="`thread-list-item ${locate} ${active?'active':''}`" @click.stop="_switchThread" ref="threadListItem">
			<div class="iconfont icontongyongguanbi del" @click.stop="_hideThread"></div>
			<div v-show="inList&&thread.topTime" class="iconfont iconzhiding"></div>
			<img
				ref="threadAvatar"
				:class="{avatar:true,notify:thread.type===10001,avatargerenbg:thread.type==0,avatarqunbg:thread.type==1,avatarLoadFinish: avatarLoadFinish}"
				:src="threadInfo.avatar"
				@error="avatarLoadError"
				@load="avatrLoadSucc"
				@click="showPersonalInfo"
				:style="{'cursor': avatarClickable?'pointer':'default'}"
			/>

			<div class="main">
				<div class="thread-name">
					<span class="name">{{threadInfo.name}}</span>

					<!-- 工作状态 -->
					<a-tooltip v-if="threadInfo.workingStatusId&&locate=='in-chat'" class="working-status-value" placement="bottomLeft" :destroyTooltipOnHide="true" overlayClassName="work-status-tooltip" :getPopupContainer="()=>$refs.threadListItem">
						<template slot="title">
							<span>{{threadInfo.workingStatusValue||this.$t(`workStatus.defaultStatus[${threadInfo.workingStatusId - 1}]`)}}</span>
						</template>
						<img v-if="threadInfo.workingStatusExpression" :src="$utils.message.getEmojiSrc(threadInfo.workingStatusExpression)">
						{{threadInfo.workingStatusValue||this.$t(`workStatus.defaultStatus[${threadInfo.workingStatusId - 1}]`)}}
					</a-tooltip>

					<span v-if="threadInfo.workingStatusId&&locate!='in-chat'" class="working-status-value">
						<img v-if="threadInfo.workingStatusExpression" :src="$utils.message.getEmojiSrc(threadInfo.workingStatusExpression)">
						{{threadInfo.workingStatusValue||this.$t(`workStatus.defaultStatus[${threadInfo.workingStatusId - 1}]`)}}
					</span>
				</div>

				<!-- 在线状态 -->
				<span
					class="online-count"
					v-if="locate==='in-chat'&&thread.type==0&&onlineStatus"
				>{{onlineStatus}}</span>
				<span
					class="online-count"
					v-if="locate==='in-chat'&&thread.type==1&&onlineCount>0"
				>{{onlineCount}}{{$t('common.peopleOnline')}}</span>

				<!-- 最后一条消息 -->
				<div :class="{'thread-last-message':true}" v-show="inList&&((thread.draft&&thread.draft.text)||thread.lastMessage)">
					<!-- 【有人@我】 -->
					<div v-if="thread.firstAtMeID&&!active" style="color: #ff5435;">
						[{{$t('chat.aite[1]')}}]
					</div>
					<div ref="lastMessageText"></div>
				</div>
			</div>

			<slot></slot>

			<template v-if="inList">
				<div
					class="thread-time top-right-item"
					v-if="(thread.lastMessage&&thread.lastMessage.timestamp)||thread.lastMessageTimestamp"
				>
					{{lastmessageTime}}
				</div>

				<div v-if="isLocked" class="bottom-right-item not-disturb">
					<div class="iconfont iconsuoding" style="color:#C7C7C7;"></div>
				</div>

				<div
					class="unread-count bottom-right-item"
					v-if="!isLocked&&!active&&!thread.notDisturb&&thread.unreadCount"
				>
					{{thread.unreadCount > 99 ? '99+' : thread.unreadCount}}
				</div>

				<div v-if="!isLocked&&thread.notDisturb" class="bottom-right-item not-disturb">
					<div v-if="!_isMyself(thread.userId)" class="iconfont iconmiandarao"></div>
					<div v-show="thread.unreadCount>0" class="red-point"></div>
				</div>
			</template>
		</div>

		<a-menu slot="overlay" @click="dropDownMenuClick" v-if="inList">
			<a-menu-item
				v-if="menuItems.setTop"
				@click="setTop"
			>
				{{thread.topTime ? $t('chat.removeFromTop') : $t('chat.stickyOnTop')}}
			</a-menu-item>

			<a-menu-item @click="_hideThread">
				{{$t('chat.removeChat')}}
			</a-menu-item>

			<a-menu-item
				v-if="menuItems.notDisturb"
				@click="notDisturb"
			>
				{{thread.notDisturb !=1 ? $t('chat.muteNotifications') : $t('chat.allowNotifications')}}
			</a-menu-item>

			<a-menu-item
				v-if="menuItems.personalInfo"
				@click="showPersonalInfo(true)"
			>
				{{$t('userCard.personalInfo')}}
			</a-menu-item>

			<a-menu-item
				v-if="menuItems.clear"
				@click="deleteChatConfirm(thread.unreadCount)"
			>
				{{$t('chat.clearHistory')}}
			</a-menu-item>
		</a-menu>
	</a-dropdown>
</template>

<script>
	export default {
		name: 'Thread',
		props: {
			thread: {
				type: Object,
				default: () => ({})
			},
			active: {
				type: Boolean,
				default: false
			},
			onlineCount: {
				type: Number,
				default: 0
			},
			locate: {
				type: String,
				default: 'in-list' // list:会话列表    in-chat  聊天界面   in-setup 设置界面
			}
		},
		data() {
			return {
				isDefaultAvatar: false,
				avatarLoadFinish: false,
				dropDownVisible: false,
				notifyIcon: require('@/assets/img/system_msg.png'),
				points_assisstant_icon: require('@/assets/img/points_assisstant_icon.png')
			}
		},
		computed: {
			menuItems() {
				const items = {}
				const threadID = this.thread.id
				const threadType = this.thread.type

				if (threadType == 0) {
					items.personalInfo = true
				}

				if (!(threadType == 1 && this.thread.latestStatus != '8') && threadID != 'point') {
					items.setTop = true
				}

				if (!(threadType == 1 && this.thread.latestStatus != '8') && !this._isMyself(this.thread.userId) && threadID != 'point') {
					items.notDisturb = true
				}

				if (!this.isLocked && !['notify', 'point'].includes(threadID)) {
					items.clear = true
				}

				return items
			},
			isLocked() {
				return this.thread.type == 1 && this.thread.state == 0
			},
			onlineStatus() {
				const friendInfo = this.$store.getters['User/userInfo'](this.thread.userId)
				if (friendInfo) {
					return friendInfo.onlineState == 1
						? this.$t('common.online') : this.$utils.time.formatOnlineTime(friendInfo.onlineTime)
				} else {
					return ''
				}
			},
			threadInfo() {
				let info = {}
				switch (this.thread.type) {
				case 0:
					info = {
						name: this.thread.name,
						avatar: this.thread.avatar,
						workingStatusId: this.thread.workingStatusId,
						workingStatusValue: ['1', '2', '3', '4'].includes(this.thread.workingStatusId) ? '' : this.thread.workingStatusValue,
						workingStatusExpression: this.thread.workingStatusExpression
					}
					break
				case 1:
					let memberNum = ''
					if (this.locate === 'in-chat' && this.thread.latestStatus == '8') {
						memberNum = `(${this.thread.memberNum})`
					}
					info = {
						name: `${this.thread.name}${memberNum}`,
						avatar: this.thread.avatar
					}
					break
				case 10001:
					const threadID = this.thread.id
					if (threadID === 'notify') {
						info = {
							name: this.$t('common.systemMessage'),
							avatar: this.notifyIcon
						}
					} else if (threadID === 'point') {
						info = {
							name: this.$t('point.pointsAssisstant'),
							avatar: this.points_assisstant_icon
						}
					}
					break
				}
				return info
			},
			lastmessageTime() {
				return this.$utils.time.formatForList(this.$utils.time.formatTimestamp(this.thread.lastMessage ? this.thread.lastMessage.timestamp : this.thread.lastMessageTimestamp, 'Y/M/D h:m:s'))
			},
			lastMessageText() {
				if (this.thread.type == 1 && this.thread.state == 0) {
					return ''
				}

				let text = ''
				const draft = this.thread.draft

				if (!this.active && draft && draft.text) {
					text = `【##HTML##】<span class="unread-tag caogao">[${this.$t('common.draft')}]</span>【##HTML##】${draft.text}`
				} else {
					const lastMessage = this.thread.lastMessage
					if (lastMessage && lastMessage.text) {
						// 特殊消息
						if (lastMessage.burntAfterRead == 1 && lastMessage.cForm != 53 && lastMessage.isSend == 0) {
							text = `[${this.$t('chat.burnAfterReading')}]`
						} else if (lastMessage.mType === 'card') {
							text = `[${this.$t('common.contactCard')}]`
						} else if (lastMessage.cForm == this.$CHAT_MSG_TYPE.TYPE_CHATRECORD) {
							text = `[${this.$t('chat.chatHistory')}]`
						} else if (lastMessage.cForm == 78) {
							let remark = this.$t('point.bestWishes')
							if (lastMessage.data && lastMessage.data.bonusCoverText) {
								remark = lastMessage.data.bonusCoverText
							}
							text = `[${this.$t('point.pointsPackets')}]${remark}`
						} else if (lastMessage.cForm == this.$CHAT_MSG_TYPE.TYPE_LOCATION) {
							text = `${this.$t('location.name')}`
						} else {
							text = lastMessage.text
						}
						// 单聊消息前加上已读/未读
						if (
							this.thread.type == 0 &&
							lastMessage.isSend &&
							!/apply|agree/.test(lastMessage.id) &&
							lastMessage.cForm != 53 &&
							lastMessage.status == 1 &&
							this.thread.userId != this.thread.lastMessage.senderID
						) {
							let text1 = this.$t('chat.unread')
							let text2 = this.$t('chat.read')
							if (lastMessage.cForm === this.$CHAT_MSG_TYPE.TYPE_FILE) {
								text1 = this.$t('chat.unchecked')
								text2 = this.$t('chat.checked')
							}
							if (lastMessage.cForm != this.$CHAT_MSG_TYPE.TYPE_REALAUDIO) {
								text = `${lastMessage.unreadCount > 0 ? '【##HTML##】<span class="unread-tag">[' + text1 + ']</span>【##HTML##】' : '[' + text2 + ']'}${text}`
							}
						}

						// 群聊消息前加上发送者
						if (
							this.thread.type == 1 &&
							!lastMessage.isSend &&
							!/tip_/.test(lastMessage.mType)
						) {
							let senderName = ''
							if (lastMessage.isAnoymous) {
								senderName = lastMessage.name
							} else {
								senderName = this.$store.getters.latestUsername(lastMessage.senderID, this.thread.type, this.thread.id)
								if (!senderName) {
									senderName = this.thread.lastMessage.name
								}
							}
							text = `${senderName}：${text}`
						}

						if (!(this.thread.firstAtMeID && !this.active)) {
							// 未读数
							text =
								this.thread.notDisturb &&
								!this.active &&
								this.thread.unreadCount > 1
									? `[${this.thread.unreadCount}${this.$t('chat.messageUnit')}]${text}`
									: text
						}
					}
				}

				// 表情
				if (text) {
					text = text.replace(/\r\n/g, '【##HTML##】<br>【##HTML##】')
					text = this.$utils.message.replaceEmojiCodeIntoEmojiIcon(text)
				}

				return text
			},
			inList() {
				return this.locate === 'in-list'
			},
			avatarClickable() {
				return (
					(this.locate === 'in-chat' || this.locate === 'in-setup') &&
					this.thread.type == 0
				)
			}
		},
		watch: {
			'thread.latestStatus'(val) {
				if (this.active) {
					this.notExistThread()
				}
			},
			active: {
				handler: function(nval, oval) {
					if (nval) {
						if (['1', '6', '9'].includes(this.thread.latestStatus)) {
							this.notExistThread()
						} else {
							this.getStatus()
						}

						this.reloadAvatar()
					}
				},
				immediate: true
			},
			lastMessageText: {
				handler: function(text) {
					if (text) {
						if (this.active) {
							this.$emit('last-message-changed')
						}

						const frag = document.createDocumentFragment()
						const domContainer = document.createElement('div')
						const text_arr = text.split('【##HTML##】')
						text_arr.map(node => {
							if (/<img data-fromaa/.test(node)) {
								domContainer.innerHTML = node
								frag.appendChild(domContainer.children[0])
							} else if (node == '<br>') {
								frag.appendChild(document.createElement('br'))
							} else if (/class="unread-tag/g.test(node)) {
								domContainer.innerHTML = node
								frag.appendChild(domContainer.children[0])
							} else {
								frag.appendChild(document.createTextNode(node))
							}
						})

						this.$nextTick(() => {
							domContainer.innerHTML = ''
							domContainer.appendChild(frag)
							const targetDOM = this.$refs.lastMessageText

							if (!targetDOM) return // 防错
							if (targetDOM.children[0]) {
								targetDOM.replaceChild(domContainer, targetDOM.children[0])
							} else {
								targetDOM.appendChild(domContainer)
							}
						})
					} else if (this.$refs.lastMessageText) {
						this.$refs.lastMessageText.innerHTML = ''
					}
				},
				immediate: true
			}
		},
		methods: {
			reloadAvatar() {
				if (this.isDefaultAvatar && this.threadInfo.avatar) {
					const avatar = new Image()
					avatar.src = this.threadInfo.avatar
					avatar.onload = () => {
						this.$refs.threadAvatar.src = avatar.src
						this.isDefaultAvatar = false
					}
				}
			},
			avatarLoadError(e) {
				this.$utils.setDefaultAvatar(e, this.thread.type)
				this.isDefaultAvatar = true
			},
			avatrLoadSucc() {
				this.avatarLoadFinish = true
			},
			dropDownMenuClick() {
				this.dropDownVisible = false
			},
			setTop() {
				if (!this.$store.state.Setting.online) {
					this.$message.error(this.$t('common.netErrorTip[0]'))
					return
				}

				this.$store.dispatch('Chat/setTop', this.thread)
			},
			showPersonalInfo(byContextmenu) {
				if (byContextmenu !== true && !this.avatarClickable) return
				if (this.thread.userId) {
					this.$store.dispatch('OPcomponent/set_userCard', {
						userId: this.thread.userId
					})
				}
			},
			_hideThread() {
				if (!this.$store.state.Setting.online) {
					this.$message.error(this.$t('common.netErrorTip[0]'))
					return
				}

				if (!this.notExistThread()) {
					this.$emit('delThread', this.thread.id)
				}
			},
			notExistThread() {
				const status = this.thread.latestStatus// 会话的最新状态
				if (!['1', '6', '9'].includes(status)) return false
				this.$emit('notExist', { threadID: this.thread.id, status })
				return true
			},
			getStatus() {
				const data = { custError: true }
				if (this.thread.type == 1) {
					data.groupId = this.thread.id.split('_')[0]
				} else if (this.thread.type == 0) {
					data.userId = this.thread.userId.split('_')[0]
				} else {
					return
				}

				this.$utils.api.user.verifyFriendRelation(data).get().then(res => {
					console.log('用户或群组状态：', res)
					if (res.code == 0) {
						if (this.thread.latestStatus != res.data.status) {
							this.$store.commit('Chat/updateThread', {
								threadID: this.thread.id,
								updatingData: { latestStatus: res.data.status }
							})
						}
					}
				}).catch(e => {
					console.log(e)
				})
			},
			_switchThread() {
				if (this.isLocked) {
					this.$message.error(this.$t('chat.lockGroupTip[0]'))
				}
				if (this.isLocked || this.thread.id == this.$store.state.Chat.currentThreadID) return
				// 切换聊天界面，清空图片浏览器数组
				this.$store.dispatch('Chat/setImagePlayerArray', { action: 'clear' })
				this.$store.dispatch('Chat/switchThread', { threadID: this.thread.id })
			},
			deleteChatConfirm(unreadCount) {
				this.$store.dispatch('OPcomponent/set_deleteChatConfirm', {
					deleteId: this.thread.id
				})
			},
			_isMyself(userId) {
				return userId == this.$store.state.User.accountInfo.userId
			},
			async notDisturb() {
				if (!this.$store.state.Setting.online) {
					this.$message.error(this.$t('common.netErrorTip[0]'))
					return
				}

				const updatingData = {
					groupId: this.thread.id,
					notDisturb: this.thread.notDisturb ? 0 : 1
				}

				if (this.thread.id === 'notify') {
					updatingData.sysMsgNotDisturb = this.thread.notDisturb ? 0 : 1
					this.$utils.api.user.update({ sysMsgNotDisturb: updatingData.notDisturb }).get()
					this.$store.dispatch('Chat/updateThread', {
						threadID: 'notify',
						updatingData: { notDisturb: updatingData.notDisturb }
					})
				} else if (this.thread.id === 'point') {

				} else {
					if (this.thread.type == 0) {
						updatingData.userId = this.thread.userId
					}
					this.$store.dispatch('updateThreadSetup', {
						type: 'send',
						updatingData: updatingData
					})
				}
			}
		}
	}
</script>

<style lang="scss">
  .thread-list-right-menu {
    min-width: 110px !important;
  }
  .thread-list-item {
    position: relative;
    display: flex;
    height: 65px;
    align-items: center;
    padding: 0 12px 0 16px;
    border-bottom: $border;
    font-size: 16px;
    color: #333;
	user-select: none;

	.work-status-tooltip{
	  max-width: 420px!important;
	  .ant-tooltip-arrow{
		  display: none!important;
	  }
	  .ant-tooltip-inner{
		    background:#fff6dc!important;
			color:#333!important;
			font-size: 12px!important;
			padding:8 12px!important;
			box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.15)!important;
			border-radius: 0!important;
			min-height: auto!important;
	  }
  	}

	.iconzhiding{
		position: absolute;
		top:0;
		right: 0;
		color:#abcfff;
		font-size: 10px;
		line-height: 10px;
	}

    .del {
      position: absolute;
      left: 4px;
      top: 50%;
      margin-top: -9px;
      font-size: 8px;
      visibility: hidden;
    }

    .avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      margin-right: 11px;
	    &.avatarLoadFinish{
		    background: #fff!important;
	    }
    }

    .main {
      flex: 1;
    }

    .thread-last-message,
    .thread-time {
      font-size: 12px;
      color: $gray;
    }

    .thread-last-message {
      width: 118px;
      height: 16px;
      position: absolute;
      bottom: 0;
      left: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      .emoji {
        width: 16px;
        height: 16px;
        vertical-align: text-top;
      }

	  div{
		  display: inline;
	  }

      &.at::before {
        content: "[有人@我]";
        color: #ff5435;
      }
    }

    .top-right-item {
      position: absolute;
      top: 12px;
      right: 12px;
    }

    .bottom-right-item {
      position: absolute;
      bottom: 12px;
      right: 12px;
      &.not-disturb {
        display: flex;
        align-items: center;

        .red-point {
          width: 10px;
          height: 10px;
          background: red;
          border-radius: 50%;
          margin-left: 8px;
        }
      }
    }

    .unread-tag {
	    color: $darkBlue;
      &.caogao{
	      color:#ff9000;
      }
    }

    .unread-count {
      color: #fff;
      font-size: 10px;
      padding: 0 4px;
      background-color: #ff3b30;
      display: inline-block;
      height: 15px;
      line-height: 15px;
      min-width: 15px;
      text-align: center;
      border-radius: 10px;
    }

    .iconmiandarao {
      color: $lightGray;
    }

    &.in-list .main,&.in-chat .main {
      height: 42px;
      position: relative;
    }

    &.in-list:hover,
    &.in-list.active {
      background-color: #e7e8ea;
    }
    &.in-list:hover .del {
      visibility: visible;
    }

	.online-count {
		position: absolute;
		bottom: 0;
		left: 0;
        color: #999;
        font-size: 12px;
        line-height: 12px;
	    font-weight: normal;
    }

	.thread-name{
		display: flex;
		align-items: center;
		overflow: hidden;
		.name{
			max-width: 100%;
			display: block;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.working-status-value{
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			flex:1;
			margin-left:8px;
			font-size: 12px;
			color: #999999;
			img{
				display: inline-block;
				vertical-align:sub;
				width:14px;
				height:14px;
				margin-right:4px;
			}
		}
	}

    &.in-list .thread-name,&.in-chat .thread-name {
      width: 100px;
      position: absolute;
      top: 0;
      left: 0;
    }

    &.in-chat {
      background: #f6f7f8;
		  .thread-name{
			  width:100%;
		  }
	    .online-count{
		    bottom: 3px;
		}

		.thread-name{
			padding-right:20px;
		}
    }

    &.in-setup {
      font-size: 18px;
      line-height: 38px;
      border-bottom: none;
      padding-left: 0;
      padding-top: 22px;
      padding-bottom: 20px;

	  .thread-name{
		max-width:280px;
	  }
    }
  }
</style>
