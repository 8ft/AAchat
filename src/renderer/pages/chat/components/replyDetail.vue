<template>
	<div id="replyDetail" :class="{hidden:!visible,animate:animate}" v-clickoutside="_hideSetting" ref="replyDetail">
		<div class="title">
			<div>{{$t('common.detail')}}</div>
			<i class="iconfont icontongyongguanbi hoverable" @click="_hideSetting" />
		</div>

		<div class="reply-detail">
			<div class="reply-target" v-if="baseInfo.replyInfo">
				<div class="target-info">
					<img :src="baseInfo.replyInfo.headImgUrl">
					<div>
						<span>{{baseInfo.replyInfo.nickname}}</span>
						<span v-if="serverTime">{{$utils.time.formatForDetail($utils.time.formatTimestamp(baseInfo.replyInfo.msgTime,'Y/M/D h:m:s'),serverTime)}}</span>
					</div>
				</div>
				<chat-bubble
					v-if="target&&target.id"
					:hasContextmenu="false"
					:message="target.replyInfo"
					:auto-update="false"
					:parent-id="target.id"
					@update="(data)=>{_bubbleUpdate(data)}"
				/>
				<div v-if="target===null" class="target-not-exist">
					<img src="@/assets/img/shixiao@2x.png">
					<div>{{$t('common.fileMessageNotExist')}}</div>
				</div>
			</div>

			<chat-bubble v-if="reply&&reply.id" :hasContextmenu="false" :message="reply" :auto-update="false" />
		</div>
	</div>
</template>

<script>
	import ChatBubble from './ChatBubble/index'

	export default {
		name: 'ReplyDetail',
		components: {
			ChatBubble
		},
		props: {
			baseInfo: {
				type: Object,
				default: () => ({})
			},
			animate: {
				type: Boolean,
				default: true
			},
			visible: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				serverTime: 0,
				target: {},
				reply: {}
			}
		},
		watch: {
			'baseInfo.id': {
				handler: function(val) {
					if (val) {
						this.target = {}
						this.reply = {}
						this.$nextTick(() => {
							this._getTarget()
							this._getReply()
							this.serverTime = this.$utils.fun.getServerTime('charRecord')
						})
					}
				},
				immediate: true
			}
		},
		methods: {
			async _getTarget() {
				if (this.baseInfo && !this.baseInfo.replyInfo.cForm) {
					const tempReplyInfo = {
						inReply: true,
						cForm: this.baseInfo.replyInfo.form,
						url: this.baseInfo.replyInfo.path,
						burntAfterRead: 0,
						name: this.baseInfo.replyInfo.nickname,
						headImgUrl: this.baseInfo.replyInfo.headImgUrl,
						timestamp: this.baseInfo.timestamp,
						text: this.baseInfo.replyInfo.content,
						senderID: this.baseInfo.replyInfo.userId,
						ext: this.baseInfo.replyInfo.fileType,
						data: {
							webTitle: this.baseInfo.replyInfo.webTitle,
							shareLink: this.baseInfo.replyInfo.shareLink,
							webDescription: this.baseInfo.replyInfo.webDescription
						}
					}
					await this.$store.dispatch('Chat/updateMsg', {
						id: this.baseInfo.id,
						updatingData: {
							replyInfo: Object.assign({}, this.baseInfo.replyInfo, tempReplyInfo)
						}
					})
				}
				this.target = this.baseInfo
			},

			_getReply() {
				if (this.baseInfo.replyInfo) {
					const message = Object.assign({}, this.baseInfo, { cForm: 101, isKeyTime: 0 })
					this.reply = message
				} else {
					this.reply = null
				}
			},

			_bubbleUpdate(data) {
				// const newMessage = window._.assign({}, this.target)
				if (data.sendProgress !== undefined) {
					this.$store.dispatch('Chat/downloadFileProgress', { msgID: this.baseInfo.id, progress: data.sendProgress, downloadRate: data.downloadRate })
				} else {
					if ([this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_FILE, this.$CHAT_MSG_TYPE.TYPE_VIDEO, this.$CHAT_MSG_TYPE.TYPE_EMOJI].includes(this.baseInfo.replyInfo.form) && data) {
						this.$store.dispatch('Chat/updateMsg', {
							id: this.baseInfo.id,
							updatingData: {
								replyInfo: Object.assign({}, this.baseInfo.replyInfo, { ...data })
							}
						})
					}
				}
				/*
				if (data.mType === 'link') {
					newMessage.mType = 'link'
					newMessage.data = data.data
				}

				if ([102, 103, 105, 113].includes(newMessage.cForm) && data.data) {
					Object.assign(newMessage, data.data)
					this.$store.dispatch('Chat/updateMsg', {
						id: this.baseInfo.id,
						updatingData: {
							replyInfo: Object.assign({}, this.baseInfo.replyInfo, data.data)
						}
					})
				}
				this.target = newMessage*/
			},

			_hideSetting(e) {
				if (this.userCardWorking) return
				this.$emit('hide')
				setTimeout(() => {
					// 初始化
					this.target = {}
					this.reply = {}
					this.serverTime = 0
				}, 300)
			}
		}
	}
</script>

<style lang="scss">
  #replyDetail {
    position: absolute;
    top: 0;
    right: 0;
    width: 517px;
    height: 100%;
    display: flex;
    flex-direction: column;
    background:#F6F7F8;
		box-shadow: 0px 4px 16px 0px rgba(224, 224, 224, 0.55);
		box-sizing: border-box;
    z-index: 1000;
    &.hidden {
      transform: translateX(100%);
      box-shadow: 0px 0px 0px 0px rgba(224, 224, 224, 0)!important;
    }

    &.animate{
      transition: all 0.3s ease-out;
    }

    .title {
      height: 80px;
      font-size: 18px;
      color: #333;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #f0f0f0;
	  padding-left: 30px;
	  background: #fff;
      div {
        flex: 1;
      }
      .iconfont {
        font-size: 12px;
        padding: 20px 30px 20px 20px;
      }
	}

	.reply-detail{
		flex:1;
		overflow-y: auto;
	}

	.reply-target{
		padding: 20px 18px;
		background: #fff;
		width:504px;
		min-height: 122px;
		box-sizing: border-box;
		margin: 10px auto 30px;

		.chatBubble{
			.avatar{display: none!important;}
			.bubble-body{max-width: none!important;}
			.text{border:none!important;padding:0!important;}
		}
	}

	.target-info{
		display: flex;
		margin-bottom: 20px;
		span{
			display: block;
			font-size: 14px;
			color:#333;
			line-height: 20px;
		}
		img{
			width:40px;
			height: 40px;
			border-radius: 50%;
			margin-right: 12px;
		}
	}

	.chatBubble{
		padding-bottom: 0!important;
		.unreadCount{display: none!important;}
		.nickName{display: none!important;}
		.get .avatar{margin-left:25px!important;}
		.send .avatar{margin-right: 25px!important;}
	}

	.target-not-exist{
		text-align: center;
		font-size: 14px;
		color:#333;
		img{width:34px;margin-bottom: 15px;}
	}

  }
</style>

