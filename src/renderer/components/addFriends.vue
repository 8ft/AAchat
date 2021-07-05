<!--添加好友-->
<template>
	<div>
		<a-modal :mask-closable="false" :title="$t('common.addFriends')" class="addFriend" centered :width="420" :closable="false" @cancel="doClose" :visible="visible === 'findUser'">
			<a-input :placeholder="$t('common.addFriendTip')" v-model.trim="searchText" />
			<template #footer>
				<a-button type="primary" :disabled="!(searchText.length > 0)" :loading="modalSpinning" @click="findUser">
					{{$t('common.okBtn')}}
				</a-button>
				<a-button @click="doClose">
					{{$t('common.exitBtn')}}
				</a-button>
			</template>
		</a-modal>
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
		<a-modal :title="$t('common.addFriends')" :mask-closable="false" class="selectUser" centered :width="420" @cancel="doClose" :visible="visible === 'selectUser'">
			<div v-for="(item,index) in selectUserList" :key="'users-'+ index">
				<div @click="showAddUser(item.userId, item.findWay)">
					<AAlist-item class="selectUser-item" :title="item.nickName" :src="item.userAvatar || defaultAvatar" :desc="`${item.areaCode}<i>${$utils.jsencrypt.Aesdencrypt(item.userMobile, $store.state.User.secretKey)}</i>`" :key="'selectUser-' + index"></AAlist-item>
				</div>
			</div>
			<template #footer></template>
		</a-modal>
	</div>
</template>

<script>
	import UserCard from '@/components/UserCard/index.vue'
	import AAlistItem from '@/components/AAlist/item.vue'
	export default {
		props: {
			visible: {
				type: String,
				default: 'findUser'
			}
		},
		name: 'AddFriends',
		components: {
			UserCard, AAlistItem
		},
		data() {
			return {
				searchText: '',
				modalSpinning: false,
				selectUserList: [],
				userCardParams: {
					userId: '',
					comfirmText: '',
					comfirm: ''
				}
			}
		},
		methods: {
			doClose() {
				this.$emit('update:visible', '')
				this.searchText = ''
				this.modalSpinning = false
			},
			findUser() { // 查找用户
				var reg = /^\s*$/
				if (this.searchText.match(reg)) return this.$message.error(this.$t('common.noData'))
				this.modalSpinning = true
				this.$utils.api.user.findUsers({ searchText: this.searchText }).get().then(res => {
					this.modalSpinning = false
					if (res.data.list.length < 1) { // 注册不同区号的同一手机号会是多个用户
						return this.$message.error(this.$t('search.noFindTips'))
					} else if (res.data.list.length == 1) {
						this.showAddUser(res.data.list[0].userId, res.data.list[0].findWay)
					} else {
						this.selectUserList = res.data.list || []
						this.$emit('update:visible', 'selectUser')
					}
				}).catch((e) => {
					this.modalSpinning = false
				})
			},
			showAddUser(userId, way) { // 展示查找用户的结果
				this.userCardParams = {
					userId: userId,
					comfirmText: '',
					comfirm: '',
					way: way || ''
				}
				if (this.onlineCheck()) this.$emit('update:visible', 'showUser')
			}
		}
	}
</script>

<style scoped>

</style>
