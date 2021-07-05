<template>
	<div id="addressBook-message">
		<template v-if="$route.params.id == 'newFriends'">
			<AAlist-item class="tittle" :title="$t('common.newFriends')" :key="'newFriends-tittle'"></AAlist-item>
			<a-spin :spinning="spinning" v-if="spinning"></a-spin>
			<div class="message-list newFriends">
				<div v-if="newFriendList.length">
					<AAlist-item v-for="(item,index) in newFriendList" :key="'newFriends-item'+ index" class="message-item"
						:src="item.fromUserAvatar || defaultAvatar"
						:title="(item.fromUserLabel ? item.fromUserLabel : item.fromNickName)"
						:desc="item.followMsg || item.defaultMsg" :data="item" :leftCallback="showNewFriend"
						:centerCallback="showNewFriend"
					>
						<template v-slot:right>
							<span class="time">{{$utils.time.formatForList(item.updateTime)}}</span>
							<a-button class="add" type="primary" ghost @click="checkBlackList(item)" :loading="btnLoading.includes(item.id)" :disabled="item.state != 0||addingFriend">
								{{item.state == 0 ? $t('common.add') : $t('common.added')}}
							</a-button>
						</template>
					</AAlist-item>
				</div>
				<div class="default" :key="'newFriends-default'" v-else-if="!spinning">
					<div class="main">
						<img src="~@/assets/img/nothing.png" width="240" height="200">
						<p>{{$t('common.nothingTips')}}</p>
					</div>
				</div>
			</div>
			<a-modal :title="$t('common.prompt')" class="notification-IM" centered :width="420" :closable="false"
				@cancel="doClose" :visible="visible=='isRemoveBlacklist'"
			>
				<p>{{$t('chat.blacklistOp[0]', { name: currentItem.fromUserLabel ? currentItem.fromUserLabel : currentItem.fromNickName })}}</p>
				<template #footer>
					<a-button type="primary" :disabled="modalSpinning" :loading="modalSpinning" @click="deleteBlackUser(currentItem)">
						{{$t('common.okBtn')}}
					</a-button>
					<a-button @click="doClose">
						{{$t('common.exitBtn')}}
					</a-button>
				</template>
			</a-modal>
		</template>

		<template v-else-if="$route.params.id == 'myGrounps'">
			<AAlist-item class="tittle" :title="$t('common.AAgroups')" :key="'myGrounps-tittle'"></AAlist-item>
			<a-spin :spinning="spinning" v-if="spinning"></a-spin>
			<div class="message-list">
				<div v-if="myGrounpList.length">
					<div v-for="(item,index) in myGrounpList" :key="'myGrounps-item'+ index"
						@click="()=>{$store.dispatch('Chat/openThread',{id:item.groupId,type:1}).catch(e=>{})}"
					>
						<AAlist-item class="message-item" :src="item.groupAvatar || avatarError"
							:title="item.groupLabel || item.groupName" :desc="`${item.groupUsers.length + $t('common.people')}`"	:avatarError="avatarError"
						></AAlist-item>
					</div>
				</div>
				<div class="default" :key="'myGrounps-default'" v-else-if="!spinning">
					<div class="main">
						<img src="~@/assets/img/nothing.png" width="240" height="200">
						<p>{{$t('common.nothingTips')}}</p>
					</div>
				</div>
			</div>
		</template>

		<template v-else>
			<AAlist-item class="tittle" :title="$route.query.friendGroupName || $t('common.myFriends')"
				:key="'myFriends-tittle'"
			>
				<template slot="right">
					<a-tooltip placement="left" :title="$t('common.addFriends')">
						<i class="iconfont iconjia" @click="initAddUser" style="-webkit-app-region: no-drag"></i>
					</a-tooltip>
				</template>
			</AAlist-item>
			<a-spin :spinning="spinning" v-if="spinning"></a-spin>
			<div class="message-list">
				<div ref="firends" v-if="friendGroupList.length">
					<a-dropdown
						overlayClassName="right-menu"
						:getPopupContainer="() => $refs.firends"
						@visibleChange="(visible) => contextMenuClick(visible, item)"
						:trigger="['contextmenu']"
						v-for="(item, index) in friendGroupList"
						:key="'myFriends-item'+ index"
					>
						<div @click="showMyFriend(item)">
							<AAlist-item class="message-item"
								:data="item"
								:src="item.userInfo.userAvatar || defaultAvatar"
								:title="item.label || item.userInfo.nickName"
								:desc="item.userInfo.onlineState == 1 ? $t('common.online') :$utils.time.formatOnlineTime(item.userInfo.onlineTime)"
							/>
						</div>
						<a-menu slot="overlay">
							<a-menu-item @click="showMyFriend(item)">
								{{$t('userCard.personalInfo')}}
							</a-menu-item>
							<a-menu-item @click="showMyFriend(item, 'editLabel')" v-if="item.userId != accountInfo.userId">
								{{$t('userCard.alias')}}
							</a-menu-item>
							<a-menu-item @click="deleteUser(item, 'deleteUser')" v-if="item.userId != accountInfo.userId">
								{{$t('common.deleteFriends')}}
							</a-menu-item>
							<!--1.3版本去除分组-->
							<!--<a-menu-item class="options">-->
							<!--{{$t('common.moveFriendTo')}}<i class="iconfont iconshouqi1"></i>-->
							<!--<div class="option-item ant-dropdown-menu ant-dropdown-menu-vertical ant-dropdown-menu-root ant-dropdown-menu-light ant-dropdown-content">-->
							<!--<div class="ant-dropdown-menu-item" @click="handleEditGroup(item, group)" v-for="(group, index) in friendGroups" :key="`group-${index}`">{{group.friendGroupName}}</div>-->
							<!--</div>-->
							<!--</a-menu-item>-->
						</a-menu>
					</a-dropdown>
				</div>
				<div class="default" :key="'myFriends-default'" v-else-if="!spinning">
					<div class="main">
						<img src="~@/assets/img/nothing.png" width="240" height="200">
						<p>{{$t('common.nothingTips')}}</p>
					</div>
				</div>
			</div>
		</template>

		<!--用户信息卡片-->
		<user-card ref="userCard"
			:userId="visible == 'showUser' ? userCardParams.userId : null"
			:comfirmText="userCardParams.comfirmText"
			:comfirm="userCardParams.comfirm"
			:way="userCardParams.way"
			:progress="userCardParams.userCardProgress"
			:firstModal="userCardParams.firstModal"
			:loading="modalSpinning" :cancel="doClose"
		/>
	</div>
</template>

<script>
	import AAlistItem from '@/components/AAlist/item.vue'
	import UserCard from '@/components/UserCard/index.vue'
	import qun from '@/assets/img/qun_default@2x.png'
	import geren from '@/assets/img/geren_default@2x.png'
	import getLetter from '@/utils/common/pinyin'

	export default {
		name: 'AddressBookMessage',
		components: { AAlistItem, UserCard },
		data() {
			return {
				titleCn: {
					myFriends: this.$t('common.myFriends'),
					newFriends: this.$t('common.newFriends'),
					myGrounps: this.$t('common.AAgroups')
				},
				addingFriend: false,
				btnLoading: [],
				spinning: false,
				modalSpinning: false,
				visible: '',
				searchText: '',
				selectUserList: [],
				userId: '',
				userCardParams: {
					userId: '',
					comfirmText: '',
					comfirm: ''
				},
				defaultAvatar: geren,
				avatarError: qun,
				userCardProgress: '',
				currentItem: {}
			}
		},
		computed: {
			accountInfo() {
				return this.$store.state.User.accountInfo
			},
			friendList() {
				const result = []
				this.$store.state.MyFriend.list.forEach(friend => {
					if (friend.isOnBlacklist != 1) {
						const userInfo = this.$store.state.User.list.filter(userInfo => userInfo.userId == friend.userId)
						result.push({ ...friend, userInfo: userInfo[0] || {}})
					}
				})
				return result
			},
			friendGroupList() {
				let result = []
				if (this.$route.params.id == 'myFriends') {
					result = this.friendList
				} else if (this.$route.params.id != 'newFriends' && this.$route.params.id != 'myGrounps') {
					result = this.friendList.filter(item => {
						return item.friendGroupId == this.$route.params.id
					})
				}
				let onlineList = []
				let offlineList = []
				result.forEach(item => {
					item.userInfo.onlineState == 1 ? onlineList.push(item) : offlineList.push(item)
				})
				onlineList = this.sortByPinyin(onlineList)
				offlineList = this.sortByPinyin(offlineList)
				return onlineList.concat(offlineList)
			},
			newFriendList() {
				return this.$store.state.NewFriend.list
			},
			myGrounpList() {
				console.log(this.$store.state.MyGrounp.list)
				const result = this.$store.state.MyGrounp.list.map(groupInfo => {
					const	groupUsers =	this.$store.state.MyGrounp.userRelationList.filter(userRelation => userRelation.groupId == groupInfo.groupId)
					return Object.assign({}, groupInfo, { groupUsers: groupUsers })
				})
				return result
			}
			// friendGroups() { // 分组列表
			// 	return this.$store.state.MyFriend.friendGroups
			// }
		},
		watch: {
			'$route': {
				handler: function(nVal, oVal) {
					if (this.$route.params.id == 'newFriends') {
						this.get_newFriends()
					}
				},
				immediate: true // 考虑从‘未加载本页面直接到newFriends页面’
			}
		},
		mounted()	{
			// console.log('各列表数据', this.friendGroupList, this.newFriendList, this.myGrounpList)
		},
		beforeDestroy() {
		},
		methods: {
			sortByPinyin(list = []) {
				let result = []
				const store = {}
				const letterList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')
				letterList.map(letter => {
					store[letter] = []
				})
				const letterReg = new RegExp('^[a-zA-Z]')
				// const uppercaseLetterReg = new RegExp('^[A-Z]') // 来自
				list.map(item => {
					const value = item.label || item.userInfo.nickName
					if (!value) return
					if (letterReg.test(value[0])) { // 以字母命名的情况后续可看是否有要求再优化
						store[value[0].toUpperCase()].unshift(item)
					} else if (letterReg.test(getLetter(value[0])[0])) {
						store[getLetter(value[0])[0]].push(item)
					} else store['#'].push(item)
				})
				Object.values(store).forEach(item => {
					result = result.concat(item)
				})
				return result
			},
			showMyFriend(item, progress) { // 查看好友信息
				this.userCardParams = {
					userId: item.userId,
					comfirmText: '',
					comfirm: '',
					userCardProgress: progress
				}
				if (this.onlineCheck()) this.visible = 'showUser'
			},
			deleteUser(item, firstModal) { // 查看好友信息
				this.userCardParams = {
					userId: item.userId,
					comfirmText: '',
					comfirm: '',
					firstModal: firstModal
				}
				if (this.onlineCheck()) this.visible = 'showUser'
			},
			initAddUser() { // 添加好友
				this.$eventBus.$emit('openAddFriendsWin')
				/* this.searchText = ''
				this.visible = 'findUser'*/
			},
			// 新的好友--数据加载
			get_newFriends() { // 好友/加群申请列表---包含设置消息已读
				this.$store.dispatch('NewFriend/set_list')
			},
			setALLRead() { // 设置消息已读
				this.$utils.api.message.setAllRead().get()
			},
			showNewFriend(item) { // 查看新的好友信息---基于产品设计没有删除操作
				//        let _this = this
				//        if (item.type == 0) { // 添加好友申请
				//          this.userCardParams = {
				//            userId: item.fromUserId,
				//            comfirmText: '',
				//            comfirm: ''
				//          }
				//        } else if (item.type == 1) { // 加群申请
				//          this.userCardParams = {
				//            userId: item.fromUserId,
				//            comfirmText: item.state == 0 ? this.$t('userCard.AgreeFriendsIntoGroup') : this.$t('userCard.sendMsg'),
				//            comfirm: function (data) {
				//              item.state == 0 ? _this.processApply(item) : _this.sendMSN(item.groupId)
				//            }
				//          }
				//        }
				this.userCardParams = {
					userId: item.fromUserId,
					comfirmText: '',
					comfirm: ''
				}
				if (this.onlineCheck()) this.visible = 'showUser'
			},
			processApply(item) { // 好友申请/加群申请处理
				if (this.btnLoading.includes(item.id) || (item.type == 0 && this.addingFriend)) return
				this.$refs.userCard.loading = true
				if (item.type == 0) {
					this.addingFriend = true
				}
				this.btnLoading.push(item.id)

				this.$utils.api.message.processApply({ id: item.id, action: '1' }).get().then(res => {
					//        console.log('申请处理', res,item)
					this.$refs.userCard.loading = false
					// 更新本地关联数据
					if (item.type == 0) { //  好友申请
						Promise.all([
							this.$store.dispatch('NewFriend/update_info', { id: item.id, state: '1' }),
							this.$store.dispatch('MyFriend/set_list'),
							this.$store.dispatch('User/update_info', { userId: item.fromUserId })
						]).then(e => {
							this.addingFriend = false
							this.btnLoading.splice(this.btnLoading.findIndex(val => val === item.id), 1)
							this.$store.dispatch('Chat/getNewFriend', {
								// friendID: res.data.friendUserId,
								friendID: item.fromUserId,
								isApplicant: false,
								content: item.followMsg || '',
								applyTime: item.createTimeMills
							})
							this.doClose()
						}).catch((e) => {
							this.addingFriend = false
							this.btnLoading.splice(this.btnLoading.findIndex(val => val === item.id), 1)
							this.$refs.userCard.loading = false
						})
					} else { // 进群申请
						this.btnLoading.splice(this.btnLoading.findIndex(val => val === item.id), 1)
						this.doClose()
					}
				}).catch((e) => {
					if (item.type == 0) {
						this.addingFriend = false
					}
					this.btnLoading.splice(this.btnLoading.findIndex(val => val === item.id), 1)
					this.$refs.userCard.loading = false
				})
			},
			checkBlackList(item) { // 1.9加的黑名单---同意添加前加入黑名单内容
				if (this.btnLoading.includes(item.id) || (item.type == 0 && this.addingFriend)) return
				this.currentItem = item
				if (item.type == 0) {	// 好友申请
					const	friendInfo = this.$store.getters['MyFriend/friendInfo'](item.fromUserId)
					// console.log('对方的好友信息', friendInfo)
					if (friendInfo.isOnBlacklist == 1) {
						this.visible = 'isRemoveBlacklist'
					}	else {
						this.processApply(item)
					}
				} else { // 加群申请
					this.processApply(item)
				}
			},
			deleteBlackUser(item) {
				this.modalSpinning = true
				this.$utils.api.user.deleteBlackUser({ blacklistUserId: item.fromUserId }).get().then(res => {
					this.processApply(item)
				}).catch(() => { this.modalSpinning = false })
			},
			handleEditGroup(friendInfo, groupInfo) {
				const params = { userId: friendInfo.userId, friendGroupId: groupInfo.friendGroupId }
				this.$utils.api.user.updateFriendGroup(params).get().then(res => {
					this.$store.dispatch('MyFriend/update_info', {
						userId: friendInfo.userId,
						friendGroupId: groupInfo.friendGroupId
					})
				}).catch((e) => {
				})
			},
			contextMenuClick(visible, item) {
			},
			sendMSN(id) { // 发送消息
				this.$router.push(`/chat/${id}`)
			},
			doClose() {
				this.visible = ''
				this.modalSpinning = false
			}
		},
		head() {
			return {
				title: this.titleCn[this.$route.params.id] || this.$t('common.myFriends')
			}
		}
	}
</script>

<style lang="scss">
  .addFriend, .selectUser {
    .ant-modal-header {
      background-color: #F1F2F5;
      border-bottom: none;
      padding: 14px 24px;
      .ant-modal-title {
        color: $black;
        font-size: 16px;
        font-weight: 400;
      }
    }
    .ant-modal-body {
      padding: 40px 30px;
      .ant-input {
        color: $black;
        font-size: 14px;
      }
    }
    .ant-modal-footer {
      border-top: none;
      padding: 0 30px 30px;
    }

    &.selectUser {
      .ant-modal-body {
        padding: 0;
        .selectUser-item {
          border: none;
          padding: 5px 20px;
          i {
            color: $darkBlue;
            padding-left: 5px;
          }
          &:hover {
            background-color: $bg;
          }
        }
      }
    }
  }
</style>

<style lang="scss">
  #addressBook-message {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 2px 2px 0;
    & > .tittle {
      flex: 0 0 auto;
			height: 80px;
      background-color: #FFF;
      padding: 0 10px;
			-webkit-app-region: drag;
			cursor: default;
      .iconjia {
        color: $gray;
        font-size: 20px;
        &:hover {
          color: $darkBlue;
          cursor: pointer;
        }
      }
    }
		.ant-spin {
			padding: 150px 0;
		}
		.right-menu {
			.options {
				position: relative;
				.iconshouqi1 {
					display: inline-block;
					transform: rotate(90deg);
				}
				.option-item {
					display: none;
					position: absolute;
					left: 110px;
					top: -4px;
				}
				&:hover {
					.option-item {
						display: inline-block;
					}
				}
			}
		}
    .message-list {
      flex: 1 1 auto;
      overflow-y: auto;
      .message-item {
        padding: 10px 20px;
        border: none;
        &:hover {
          background-color: $bg;
          .meta-title {
            color: $darkBlue !important;
            i {
              color: $black !important;
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
        transform: translate(-50%, -50%);
        text-align: center;
        p {
          margin: 0;
          color: $lightBlack;
          font-size: 14px;
          font-weight: 400;
          min-height: 30px;
        }
      }
    }
    .newFriends {
      .time {
        color: $gray;
        font-size: 12px;
        padding-right: 20px;
      }
      .add {
        min-width: 75px;
      }
    }
  }
</style>
