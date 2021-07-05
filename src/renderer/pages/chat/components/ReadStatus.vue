<template>
	<div
		id="readStatus"
		:style="`left:${info.x-328}px;top:${info.y-100}px;`"
		v-clickoutside.stop="_hide"
	>
		<div class="lists-header">
			{{info.cForm==$CHAT_MSG_TYPE.TYPE_FILE?$t('chat.recipientList[1]'):$t('chat.recipientList[0]')}}
		</div>

		<div class="lists">
			<template v-if="unreadList.length>0||readList.length>0">
				<div class="column" v-if="unreadList.length>=0">
					<h1>
						{{unreadList.length}}
						<span>
							{{info.cForm==$CHAT_MSG_TYPE.TYPE_FILE ? this.$t('chat.qunchecked') : $t('chat.qunread')}}
						</span>
					</h1>
					<div class="list">
						<div
							v-for="member in unreadList"
							:key="`unreadMember_${member.userId}`"
							@click.stop="_showUserCard(member)"
						>
							<img :src="member.userAvatar" @error="e => $utils.setDefaultAvatar(e, 0)" />
							<span>{{member.label||member.userLabel||member.nickName}}</span>
						</div>
					</div>
				</div>

				<div class="column" v-if="readList.length>=0">
					<h1>
						{{readList.length}}
						<span>
							{{info.cForm==$CHAT_MSG_TYPE.TYPE_FILE ? this.$t('chat.qchecked') : $t('chat.qread')}}
						</span>
					</h1>
					<div class="list">
						<div
							v-for="member in readList"
							:key="`readMember_${member.userId}`"
							@click.stop="_showUserCard(member)"
						>
							<img :src="member.userAvatar" @error="e => $utils.setDefaultAvatar(e, 0)" />
							<span>{{member.label||member.userLabel||member.nickName}}</span>
						</div>
					</div>
				</div>
			</template>
			<a-spin v-else>
				<a-icon slot="indicator" type="loading" style="font-size: 24px" spin />
			</a-spin>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'ReadStatus',
		props: {
			info: {
				type: Object,
				default: () => ({})
			},
			groupMembers: {
				type: Array,
				default: () => ([])
			}
		},
		data() {
			return {
				indicator: '<a-icon type="loading" style="font-size: 24px" spin />',
				readList: [],
				unreadList: []
			}
		},
		watch: {
			'info.id'() {
				this._getList()
			}
		},
		mounted() {
			this._getList()
		},
		methods: {
			_getList() {
				this.$utils.api.message
					.getReadUsers({ groupId: this.info.threadID, message: this.info.id, moreInfo: 1 })
					.get()
					.then(res => {
						this.readList = res.data.readList.map(user => {
							return (
								this.groupMembers.find(member => {
									return member.userId == user.userId
								}) || user
							)
						})

						this.unreadList = res.data.unreadList.map(user => {
							return (
								this.groupMembers.find(member => {
									return member.userId == user.userId
								}) || user
							)
						})

						// 如果未读数不一致，更新
						if (this.unreadList.length != this.info.unreadCount) {
							this.$store.dispatch('Chat/updateMsg', {
								id: this.info.id,
								updatingData: {
									unreadCount: this.unreadList.length
								}
							})
						}
					})
					.catch(e => {
						console.log(e)
					})
			},
			_hide(e) {
				if (e.target.className === 'unreadCount clickable') return
				this.$emit('hide')
			},
			_showUserCard(member) {
				if (
					(member.notAllowAddme != 1 || member.userId == this.myInfo.userId) &&
					!this.removingMember
				) {
					this.$store.dispatch('OPcomponent/set_userCard', {
						userId: member.userId
					})
				} else if (member.notAllowAddme == 1) {
					this.$message.warn(this.$t('chat.personalInformation'))
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
  #readStatus {
    border: 1px solid #e6e6e6;
    border-radius: 4px;
    overflow: hidden;
    position: fixed;
    z-index: 3;
    width: 328px;
    box-shadow: 1px 4px 28px 1px rgba(183, 183, 183, 0.13);

    .lists-header {
      background: #f1f2f5;
      color: #333;
      font-size: 14px;
      line-height: 37px;
      text-indent: 20px;
    }

    .lists {
      display: flex;
      height: 267px;
      background: #fff;

      .ant-spin-spinning {
        flex: 1;
        line-height: 267px;
      }

      .column {
        position: relative;
        flex: 1;
        overflow: hidden;

        color: #333;
        padding-top: 56px;
        &:nth-of-type(1) {
          border-right: 1px solid #e6e6e6;
        }

        h1 {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
          line-height: 56px;
          text-indent: 21px;
          font-size: 20px;
          font-weight: 600;
          span {
            font-size: 14px;
            font-weight: 400;
          }
        }

        .list {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          div {
            height: 40px;
            font-size: 13px;
            box-sizing: border-box;
            padding: 0 17px 0 21px;
            display: flex;
            align-items: center;

            span {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            img {
              width: 30px;
              height: 30px;
              border-radius: 50%;
              margin-right: 8px;
            }
          }
        }
      }
    }
  }
</style>

