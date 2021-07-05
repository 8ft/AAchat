<template>
	<div>
		<!--聊天记录弹窗-->
		<a-modal
			:visible="activeModal==='chatRecord'"
			class="notification-IM chat-records-box"
			:title="title||$t('chat.chatHistory')"
			centered
			:width="550"
			:maskClosable="false"
			:footer="null"
			@cancel="_modalHide"
			:afterClose="init"
		>
			<div class="chat-records" v-if="messages.length>0">
				<div class="chat-records-date">
					{{date}}
				</div>
				<div class="bubble-container" v-for="(message,index) in messages" :key="`message_${message.id}`">
					<span class="send-time" v-if="serverTime">{{$utils.time.formatForDetail($utils.time.formatTimestamp(message.timestamp,'Y/M/D h:m:s'),serverTime)}}</span>
					<chat-bubble
						:message="message"
						:auto-update="false"
						@trigger="_bubbleTrigger"
						@show-user-card="showUserCard"
						@update="(data)=>{_bubbleUpdate(data,index)}"
					/>
				</div>
			</div>
		</a-modal>

		<collection-model ref="collectionContent" :detaildata="collectionData" :cancel="()=>{activeModal = 'chatRecord'}"></collection-model>
	</div>
</template>
<script>
	import ChatBubble from './ChatBubble'
	import CollectionModel from '@/pages/collection/detailmodel'
	export default {
		name: 'ChatRecord',
		components: {
			ChatBubble,
			CollectionModel
		},
		props: {
			recordInfo: {
				type: Object,
				default: () => ({})
			}
		},
		data() {
			return {
				serverTime: 0,
				activeModal: '',
				title: '',
				date: '',
				collectionData: {},
				tempImageArray: []
			}
		},
		computed: {
			messages() {
				return this.$store.state.Chat.chatRecordMessage
			}
		},
		watch: {
			'recordInfo.id': {
				handler: async function(val) {
					if (val) {
						const messages = await this.$utils.sqlite.getChatData({
							where: `threadID = '${val}@${this.recordInfo.threadID}' and cForm!=53`,
							order: 'timestamp ASC'
						})
						this.$store.commit('Chat/setChatRecordMessage', { action: 'init', updatingData: messages })
						this.title = this.recordInfo.title
						this.date = this.recordInfo.from == this.recordInfo.to ? this.recordInfo.from : `${this.recordInfo.from} ~ ${this.recordInfo.to}`
						this.activeModal = 'chatRecord'
						// 把父窗口的图片数组暂存在tempImageArray
						this.tempImageArray = Object.assign([], this.$store.state.Chat.imagePlayerArray)
						this.$store.dispatch('Chat/setImagePlayerArray', { action: 'clear' })
						setTimeout(() => {
							this.serverTime = this.$utils.fun.getServerTime('charRecord')
						}, 500)
					}
				},
				immediate: true
			},
			'$store.state.OPcomponent.userCard.userId'(val) {
				if (this.activeModal === 'userCard' && !val) {
					if (this.$store.state.OPcomponent.userCard.next === 'openThread') {
						this._modalHide()
					} else {
						this.activeModal = 'chatRecord'
					}
				}
			}
		},
		methods: {
			async _bubbleUpdate(data, index) {
				// console.log('_bubbleUpdate::', data)
				const newMessage = JSON.parse(JSON.stringify(this.messages[index]))
				const updatingData = {}

				if (data.sendProgress !== undefined) {
					if (data.sendProgress === '' || data.sendProgress === 100) {
						if (newMessage.cForm == this.$CHAT_MSG_TYPE.TYPE_REPLY) {
							updatingData.replyInfo = Object.assign({}, newMessage.replyInfo, { localPath: data.localPath, sendProgress: data.sendProgress })
							await this.$store.dispatch('Chat/updateMsg', {
								id: newMessage.id,
								updatingData,
								updateDatabaseOnly: true
							})
						}
					} else {
						if (newMessage.cForm == this.$CHAT_MSG_TYPE.TYPE_REPLY) {
							updatingData.replyInfo = Object.assign({}, newMessage.replyInfo, { sendProgress: data.sendProgress })
						} else {
							updatingData.sendProgress = data.sendProgress
						}
					}
					this.$store.commit('Chat/setChatRecordMessage', { action: 'modify', id: newMessage.id, updatingData })
					return
				}

				if (data.mType === 'link') {
					updatingData.mType = 'link'
					updatingData.data = data.data
				} else if ([this.$CHAT_MSG_TYPE.TYPE_IMAGE, this.$CHAT_MSG_TYPE.TYPE_FILE, this.$CHAT_MSG_TYPE.TYPE_VIDEO, this.$CHAT_MSG_TYPE.TYPE_EMOJI].includes(newMessage.cForm) && (data || data.data)) {
					// 2.2.0有些数据在data.data里，有些在data里，所以加上个判断 wuxl
					Object.assign(updatingData, data.data || data)
				}

				if (newMessage.cForm === this.$CHAT_MSG_TYPE.TYPE_REPLY) {
					updatingData.replyInfo = Object.assign({}, newMessage.replyInfo, data.replyInfo || data)
				}

				await this.$store.dispatch('Chat/updateMsg', {
					id: newMessage.id,
					updatingData,
					updateDatabaseOnly: true
				})

				this.$store.commit('Chat/setChatRecordMessage', { action: 'modify', id: newMessage.id, updatingData })
			},

			showUserCard(userId) {
				this.activeModal = 'userCard'
				this.$emit('show-user-card', userId)
			},
			_bubbleTrigger(e) {
				if (e.form == this.$CHAT_MSG_TYPE.TYPE_NOTE) {
					this.activeModal = 'note'
					this.collectionData = e
					this.$refs.collectionContent.visible = true
				}
			},
			_modalHide(modal) {
				this.activeModal = ''
			},
			init() {
				if (this.activeModal != '') return
				this.$emit('hide')
				this.title = ''
				this.date = ''
				this.serverTime = 0
				this.$store.dispatch('Chat/setImagePlayerArray', { action: 'push', data: this.tempImageArray })
				this.tempImageArray = []
				this.$store.commit('Chat/setChatRecordMessage', { action: 'clean' })
			}
		}
	}
</script>

<style lang="scss">
 .chat-records-box {
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
        .chat-records {
          overflow-y: auto;
          max-height: 500px;

          .chat-records-date {
            text-align: center;
            line-height: 50px;
            font-size: 14px;
            color: #999;
          }

		  .bubble-container{
			  position: relative;
			  border-top: 1px solid #E6E6E6;
			  .chatBubble{
				  padding-top: 20px;
			  }
			  .send-time{
				  position: absolute;
				  color:#666666;
				  font-size: 12px;
				  right: 20px;
				  top:20px;
			  }
		  }

        }
      }
    }
</style>
