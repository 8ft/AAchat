<template>
	<div id="call-message">
		<template v-if="$route.params.id == 'recentCall'">
			<AAlist-item class="tittle" :title="'最近通话'" :key="'recentCall-tittle'"></AAlist-item>
			<a-spin class="message-list" :spinning="spinning">
				<div ref="message">
					<a-dropdown
						overlayClassName="right-menu"
						:getPopupContainer="() => $refs['message']"
						:trigger="['contextmenu']"
						v-for="item in callRecords" :key="item.id"
					>
						<div class="message-item">
							<!-- 未正常通话的就标红--测试统一 -->
							<AAlist-item :class="{light: item.doneForm!=202}" :src="item.userAvatar" :title="item.nickName" :desc="descConvert(item)">
								<!-- <template v-slot:left>
                <i class="iconfont iconguanbi"></i>
                <a-avatar :size="43" :src="item.userAvatar"></a-avatar>
              </template> -->
								<template v-slot:right>
									<a-tooltip placement="bottom" :title="'语音通话'">
										<i class="iconfont icondianhua1" @click="sendAudio(item)"></i>
									</a-tooltip>
								<!-- <a-tooltip placement="bottom" :title="'视频通话'">
                  <i class="iconfont iconshipin"></i>
                </a-tooltip> -->
								</template>
							</AAlist-item>
						</div>
						<a-menu slot="overlay">
							<a-menu-item @click="deleteRecord(item)">
								移除记录
							</a-menu-item>
						</a-menu>
					</a-dropdown>
				</div>
			</a-spin>
			<div class="default" :key="'recentCall-default'" v-if="!spinning&&!callRecords.length">
				<div class="main">
					<img src="~@/assets/img/nothing.png" width="240" height="200">
					<p>{{$t('common.nothingTips')}}</p>
				</div>
			</div>
		</template>
	</div>
</template>

<script>
	import AAlistItem from '@/components/AAlist/item.vue'

	export default {
		name: 'CallMessage',
		components: { AAlistItem },
		data() {
			return {
				spinning: false,
				deletingRecord: ''
			}
		},
		computed: {
			callRecords() {
				return this.$store.state.OPcomponent.callRecords.list
			}
		},
		watch: {
			'$route': { // 当前消息记录的增删改都会有推送，防止推送丢失先留着
				handler: function(nVal, oVal) {
					if (this.$route.params.id == 'recentCall') {
						this.setCallRecords()
					}
				},
				immediate: true // 考虑从‘未加载本页面直接到recentCall页面’
			}
		},
		beforeMount() {
		},
		methods: {
			sendAudio(data) {
				if (!this.onlineCheck()) return
				if (this.$store.state.OPcomponent.hasRealCall) {
					this.$message.error('当前正在通话中')
					return
				}
				const accountInfo = this.$store.state.User.accountInfo
				const userInfo = this.$store.getters['User/userInfo'](data.userId)
				const friendInfo = this.$store.getters['MyFriend/friendInfo'](data.userId)
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
			deleteRecord(data) {
				if (this.deletingRecord == data.id) return
				this.deletingRecord = data.id
				this.$utils.api.hermes.realCallDel({ id: data.id }).get().then(res => {
					this.deletingRecord = ''
					this.$message.success('移除成功')
					this.setCallRecords()
				}).catch(e => {
					this.deletingRecord = ''
					this.$message.error(e.message)
				})
			},
			setCallRecords() { // 包含设置消息已读
				this.spinning = true
				this.$store.dispatch('OPcomponent/set_callRecords').then(res => {
					this.spinning = false
				}).catch(e => {
					this.spinning = false
				})
			},
			descConvert(data) {
				return `<i class='iconfont ${data.outbound == 1 ? 'iconhuchu' : 'iconhuru'}'></i>[语音] ${this.$utils.time.formatForDetail(Number(data.startTime + '000'))}`
			}
		}
	}
</script>

<style lang="scss">
  #call-message {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 2px 2px 0;
    & > .tittle {
      cursor: auto;
      flex: 0 0 auto;
      background-color: #FFF;
      padding: 19px 20px;
      .item-center {
        padding-left: 0;
        &:hover {
          .meta-title {
            color: $black
          }
        }
      }
    }
    .message-list {
      flex: 1 1 auto;
      overflow-y: auto;
      .right-menu{
        min-width: auto!important;
      }
      .message-item{
        padding: 0 20px;
        &:hover{
          background-color: $bg;
        }
        .AAlist-item {
          padding: 8px 20px 8px 0px;
          .iconguanbi {
            color: #FFF;
            font-size: 18px;
            position: relative;
            top: 3px;
            left: 3px;
          }
          .item-center {
            .meta-description {
              color: $gray;
              i {
                font-size: 10px;
                margin-right: 3px;
              }
            }
          }
          &.light .item-center{
            .meta-title, .meta-description{color:#FF5943;}
          }
          .item-right {
            .iconfont {
              color: #CBCBCB;
              &.icondianhua1 {
                font-size: 20px;
                margin-right: 10px;
              }
              &.iconshipin {
                font-size: 23px;
              }
              &:hover {
                color: $darkBlue
              }
            }
          }
          &:hover {
            background-color: $bg;
            .iconguanbi {
              color: $gray;
            }
            .meta-title {
              color: $darkBlue !important;
              i {
                color: $black !important;
              }
            }
          }
        }
      }
    }
    .default {
      width: 100%;
      height: 100%;
      position: relative;
      .main {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 100%;
        transform: translate(-50%, -60%);
        text-align: center;
        p {
          margin: 0;
          color: $lightBlack;
          font-size: 20px;
          font-weight: 400;
          min-height: 30px;
        }
      }
    }
  }
</style>
