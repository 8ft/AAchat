<template>
	<a-modal
		class="notification-IM friend-selector"
		centered
		:title="$t('common.selectContact')"
		:width="436"
		:maskClosable="false"
		:visible="visible"
		:destroyOnClose="true"
		@cancel="_modalCancel"
		:afterClose="init"
	>
		<div id="friendSelector">
			<a-input v-model.trim="searchText" :placeholder="$t('common.search')" />
			<div class="friend-list" v-if="friends" ref="friendList">
				<a-radio-group v-model="selectedFriend">
					<a-radio
						v-for="friend in searchResult||friends"
						:key="`friend_${friend.userId}`"
						:style="radioStyle"
						:value="friend"
					>
						<img
							class="group-user-avatar"
							:src="searchResult?friend.extend.avatar:friend.userInfo.userAvatar"
							@error="e => $utils.setDefaultAvatar(e,0)"
						>
						<div class="group-user-info">
							<div class="group-user-name" v-html="searchResult?friend.extend.title:(friend.userInfo.label||friend.userInfo.nickName)"></div>
							<div class="group-user-onlineTime" v-html="serverTime?(searchResult?friend.extend.desc:_getOnlineStatus(friend.userInfo.onlineState,friend.userInfo.onlineTime)):''"></div>
						</div>
					</a-radio>
				</a-radio-group>
			</div>
		</div>
		<template #footer>
			<a-button type="primary" @click="_modalOk" :disabled="!selectedFriend">
				{{$t('common.okBtn')}}
			</a-button>
			<a-button @click="_modalCancel">
				{{$t('common.exitBtn')}}
			</a-button>
		</template>
	</a-modal>
</template>

<script>
	export default {
		name: 'FriendSelector',
		model: {
			prop: 'visible',
			event: 'done'
		},
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			thread: {
				type: Object,
				default: () => ({})
			}
		},
		data() {
			return {
				serverTime: 0,
				friends: null,
				searchText: '',
				searchResult: null,
				radioStyle: {
					display: 'block',
					height: '30px',
					lineHeight: '30px'
				},
				selectedFriend: null
			}
		},
		watch: {
			visible(val) {
				if (val) {
					setTimeout(() => {
						this.serverTime = this.$utils.fun.getServerTime('formatOnlineTime')
					}, 500)
					this.friends = this.$store.getters['friendsDetail']
				}
			},
			searchText(val) {
				this.selectedFriend = null
				if (val !== '') {
					this.searchResult = this.$store.getters.friendsDetailFilter(val, this.friends)
				} else {
					this.searchResult = null
				}
			}
		},
		methods: {
			_getOnlineStatus(state, timestamp) {
				if (state == 1) {
					return this.$t('common.online')
				} else {
					// return this.$t('common.offline')
					return this.$utils.time.formatOnlineTime(timestamp, this.serverTime)
				}
			},

			async _modalOk(modal) {
				if (this.selectedFriend) {
					this.$emit('done', false)

					const { userId, userAvatar, nickName } = this.selectedFriend.userInfo

					// let hasError = false
					const res = await this.$store.dispatch('Chat/sendMessage', {
						msg: {
							text: { userId, userAvatar, nickName }
						},
						thread: this.thread
					})

					if (res && res.code != 0) {
						// hasError = true
					}

					/* if (hasError) {
						this.$message.error('名片发送异常')
					} else {
						this.$message.success(this.$t('chat.cardWasSent'))
					}*/
				} else {
					this.$message.error(this.$t('common.pleaseSelectContact'))
					return
				}
			},

			_modalCancel(modal) {
				this.$emit('cancel')
			},

			init() {
				this.selectedFriend = null
				this.searchText = ''
				this.serverTime = 0
			}
		}
	}
</script>

<style lang="scss">
.notification-IM.friend-selector{
	.ant-modal-body{
		padding-top: 0;
	}

	#friendSelector {
	  height: 340px;
	  display:flex;
	  flex-direction: column;

	  input{
		  margin-top:16px;
		  margin-bottom: 27px;
	  }

	  .friend-list{
		flex:1;
		overflow-x: hidden;
		overflow-y: scroll;
	  }

      .ant-radio-group{
        width:100%
      }

      .ant-radio-wrapper {
        display: flex!important;
        align-items: center;
        margin-bottom: 24px;
        height: auto!important;
        line-height: auto!important;

        &.is-groupOwner{
          display: none!important;
        }

        span:not(.ant-radio){
          flex: 1;
          display: flex;
          align-items: center;
        }

        .group-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin: 0 15px;
        }
        .group-user-info{
          flex: 1;
          .group-user-name {
            color: rgba(0, 0, 0, 0.85);
            font-weight: 500;
            font-size: 14px;
            line-height: 18px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .group-user-onlineTime{
            color: #999;
            font-size: 12px;
			height:12px;
            line-height: 12px;
            margin-top: 6px;
          }
        }

      }
    }
	}
</style>

