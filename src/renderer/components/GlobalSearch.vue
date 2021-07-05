<template>
	<div class="search-offonline">
		<div class="search-container" ref="searchContainer">
			<div class="ipt-wrapper">
				<div class="iconfont iconsousuo" v-clickoutside="_hideDropdown">
					<input v-model.trim="searchText" ref="search" type="text" @click.stop="_showDropdown"
						:placeholder="placeholderText"
						@keydown.down.prevent="keyupchange($event)"
						@keydown.up.prevent="keyupchange($event)"
						@keydown.13.prevent="keyupchange($event)"
						@focus="changefocus()"
					>
				</div>
				<a-popover
					trigger="click"
					v-model="popVisible"
					placement="bottomRight"
					:getPopupContainer="() => $refs.searchContainer"
				>
					<i class="iconfont iconjia"></i>
					<template slot="content">
						<div @click="creatgroups" class="popmenu">
							<i class="iconfont iconfaqiqunliao"></i> {{$t('common.startNewGroupChat')}}
						</div>
						<div class="popmenu" @click="openAddFriendsWin">
							<i class="iconfont icontianjiahaoyou2"></i> {{$t('common.addFriends')}}
						</div>
						<div v-if="$store.state.User.accountInfo.organId!=='0'&&$store.state.User.accountInfo.empAdminFlag" @click="popVisible=false;$store.commit('setOrganizationPage','invite')" class="popmenu">
							<i class="iconfont iconyaoqing"></i> {{$t('organization.inviteFriends')}}
						</div>
						<div @click="popVisible=false;$store.commit('setOrganizationPage','index')" class="popmenu">
							<i class="iconfont iconjiaruqiye-copy"></i> {{$t('organization.join_create')}}
						</div>
					</template>
				</a-popover>
				<!-- <a-tooltip placement="bottom" :title="$t('common.startNewGroupChat')">
					<i class="iconfont iconjia" @click="creatgroups"></i>
				</a-tooltip> -->
			</div>
			<div @click.stop="_focus" v-show="isShowDropdown" class="dropdown">
				<a-tabs size="small" :activeKey="activeKey" :animated="false" @change="callback">
					<a-tab-pane :tab="$t('common.all')" key="1">
						<div class="scroll-wrapper scrollwrapper1">
							<!-- 联系人 -->
							<div class="result" v-show="friendsList.length > 0">
								<p class="title">
									{{$t('common.contacts')}}
								</p>
								<div @click="_openChat(item.groupId, -1)" v-show="index < 3" class="item-gird" :class="{isactive:isSelectitem.id===item.id}" :key="index"
									v-for="(item, index) in friendsList"
								>
									<AAlist-item
										:src="item.userAvatar"
										:title="item.title"
										:desc="item.desc"
									/>
								</div>
								<div v-show="friendsList.length > 3" @click="activeKey = '2'" class="more" :class="{isactive:isSelectitem.id==='morefriend'}">
									<div class="info">
										<i class="iconfont iconsousuo" />
										<span>{{$t('search.moreContacts')}}</span>
									</div>
									<i class="iconfont iconxiayiye" />
								</div>
							</div>
							<div v-show="friendsList.length > 0" class="block-seat"></div>
							<!-- 群组 -->
							<div class="result" v-show="groupsList.length > 0">
								<p class="title">
									{{$t('common.groups')}}
								</p>
								<div @click="_openChat(item.groupId, item.temporaryFlag)" v-show="index < 3" class="item-gird" :class="{isactive:isSelectitem.id===item.groupId}" :key="index"
									v-for="(item, index) in groupsList"
								>
									<AAlist-item
										:src="item.groupAvatar"
										:title="item.title"
										:desc="item.desc"
									/>
								</div>
								<div v-show="groupsList.length > 3" @click="activeKey = '3'" class="more" :class="{isactive:isSelectitem.id==='moremygroup'}">
									<div class="info">
										<i class="iconfont iconsousuo" />
										<span>{{$t('search.moreGroups')}}</span>
									</div>
									<i class="iconfont iconxiayiye" />
								</div>
							</div>
							<div v-show="groupsList.length > 0" class="block-seat" />
							<!--聊天记录-->
							<div class="result" v-show="chathistory.length > 0">
								<p class="title">
									{{$t('chat.chatHistory')}}
								</p>
								<div @click="_openChatdetail(item.threadID,item.id,item.timestamp)" v-show="index < 3" class="item-gird" :class="{isactive:isSelectitem.id===item.id}" :key="index + 'chathistory'"
									v-for="(item, index) in chathistory"
								>
									<AAlist-item
										:src="item.avatar"
										:title="item.name"
										:desc="item.cForm === 105 ? replacedesc(item.text + item.fileName) : replacedesc(item.text)"
									/>
								</div>
								<div v-show="chathistory.length > 3" @click="morehistory()" class="more" :class="{isactive:isSelectitem.id==='morechathistory'}">
									<div class="info">
										<i class="iconfont iconsousuo" />
										<span>{{$t('search.moreChatHistory')}}</span>
									</div>
									<i class="iconfont iconxiayiye" />
								</div>
							</div>
							<div v-show="chathistory.length > 0" class="block-seat" />
							<div v-show="isShowVague && friendsList.length === 0 && groupsList.length === 0 && chathistory.length === 0" class="resault-for-number">
								<!--<span>没有找到关于"<i>{{searchText}}</i>"的结果，你可以尝试</span>-->
								<i18n path="search.searchResult" tag="span">
									<template v-slot:keyword>
										<i>{{searchText}}</i>
									</template>
								</i18n>
								<!--<span>{{$t('search.internetSearch')}}</span>-->
							</div>
							<!-- 点击调用查找用户的接口，如果没找到，直接message提示没找到，如果有，展示添加好友面板弹窗 -->
							<h2 class="network-search" v-show="isShowVague">
								{{$t('search.internetSearch')}}
							</h2>
							<div v-show="isShowVague" @click="_findUser" class="number-search" :class="{isactive:isSelectitem.id==='searchbyonline'}">
								<i class="add iconfont iconwangluochazhao" />
								<div class="info">
									<span class="name" :title="$t('search.internetSearch2')">{{$t('search.internetSearch2')}}</span>
									<span class="other">{{searchText}}</span>
								</div>
								<i class="arrow iconfont iconxiayiye" />
							</div>
						</div>
					</a-tab-pane>
					<a-tab-pane :tab="$t('common.contacts')" key="2" forceRender>
						<div class="scroll-wrapper scrollwrapper2">
							<div class="result" v-show="friendsList.length > 0">
								<p class="title">
									{{$t('common.contacts')}}
								</p>
								<div @click="_openChat(item.groupId, -1)" class="item-gird" :class="{isactive:isSelectitem.id===item.id}" v-for="item in friendsList"
									:key="item.userAvatar + 'frien_dsList'"
								>
									<AAlist-item
										:src="item.userAvatar"
										:title="item.title"
										:desc="item.desc"
									/>
								</div>
							</div>
							<div class="block-seat" v-show="friendsList.length > 0" />
							<div v-show="isShowVague && friendsList.length === 0" class="resault-for-number">
								<!--<span>没有找到关于"<i>{{searchText}}</i>"的结果，你可以尝试</span>-->
								<i18n path="search.searchResult" tag="span">
									<template v-slot:keyword>
										<i>{{searchText}}</i>
									</template>
								</i18n>
								<!--<span>{{$t('search.internetSearch')}}</span>-->
							</div>
							<!-- 点击调用查找用户的接口，如果没找到，直接message提示没找到，如果有，展示添加好友面板弹窗 -->
							<h2 class="network-search" v-show="isShowVague">
								{{$t('search.internetSearch')}}
							</h2>
							<div v-show="isShowVague" @click="_findUser" class="number-search" :class="{isactive:isSelectitem.id==='searchbyonline'}">
								<i class="add iconfont iconwangluochazhao" />
								<div class="info">
									<span class="name" :title="$t('search.internetSearch2')">{{$t('search.internetSearch2')}}</span>
									<span class="other">{{searchText}}</span>
								</div>
								<i class="arrow iconfont iconxiayiye" />
							</div>
						</div>
					</a-tab-pane>
					<a-tab-pane :tab="$t('common.groups')" key="3">
						<div class="scroll-wrapper scrollwrapper3">
							<div class="result">
								<p class="title">
									{{$t('common.groups')}}
								</p>
								<div @click="_openChat(item.groupId, item.temporaryFlag)" :key="item.groupId + 'item-gird'" class="item-gird" :class="{isactive:isSelectitem.id===item.groupId}"
									v-for="item in groupsList"
								>
									<AAlist-item
										:src="item.groupAvatar"
										:title="item.title"
										:desc="item.desc"
									/>
								</div>
							</div>
							<div v-show="isShowVague && groupsList.length === 0" class="resault-for-number">
								<!--<span>没有找到关于"<i>{{searchText}}</i>"的结果</span>-->
								<i18n path="search.searchResult" tag="span">
									<template v-slot:keyword>
										<i>{{searchText}}</i>
									</template>
								</i18n>
								<!-- <span>网络查找</span> -->
							</div>
							<!-- 点击调用查找用户的接口，如果没找到，直接message提示没找到，如果有，展示添加好友面板弹窗 -->
							<!-- <div v-show="isShowVague" @click="_findUser" class="number-search">
								<i class="add iconfont iconwangluochazhao"></i>
								<div class="info">
									<span class="name">{{$t('search.internetSearch2')}}</span>
									<span class="other">{{searchText}}</span>
								</div>
								<i class="arrow iconfont iconxiayiye"></i>
							</div> -->
						</div>
					</a-tab-pane>
					<!--聊天记录搜索-->
					<a-tab-pane :tab="$t('chat.chatHistory')" key="4">
						<div class="scroll-wrapper chathistory scrollwrapper4">
							<!--筛选条件-->
							<div class="selectsesson" ref="selectsesson">
								<div class="selecttitle">
									<span class="selectname" style="float:left">{{$t('search.filterChatHistory')}}</span>
									<span style="float:right; margin-left: auto; margin-right: 10px;" class="right" v-if="openselect" @click="openselect = false">{{$t('search.putAway')}} <span class="iconfont iconshouqi1"></span></span>
									<span style="float:right; margin-left: auto; margin-right: 10px;" class="right" v-if="!openselect" @click="openselect = true">{{$t('search.unfold')}} <span class="iconfont iconxiala"></span></span>
								</div>
								<div class="selecttitle" v-if="openselect" @click="openselectuser">
									<span class="selectname">{{$t('common.sender')}}</span>
									<span v-for="(item, index) in searchsuerList" :key="index + 'selectname'" class="username">
										{{item.label || item.userInfo.nickName}},
									</span>
								</div>
								<div class="selecttitle" v-if="openselect">
									<a-date-picker
										:disabledDate="disabledStartDate"
										format="YYYY-MM-DD"
										v-model="startValue"
										:placeholder="$t('search.startTime')"
										@change="handleStartOpenChange"
										:getCalendarContainer="()=>$refs.selectsesson"
										:locale="locales"
										@openChange="openDatepick"
									/>
								</div>
								<div class="selecttitle" v-if="openselect">
									<a-date-picker
										:disabledDate="disabledEndDate"
										format="YYYY-MM-DD"
										:placeholder="$t('search.endTime')"
										v-model="endValue"
										@change="handleEndOpenChange"
										:getCalendarContainer="()=>$refs.selectsesson"
										:locale="locales"
										@openChange="openDatepick"
									/>
								</div>
								<div class="selecttitle lastrest" v-if="openselect" @click="resetselect">
									{{$t('search.reset')}}
								</div>
							</div>
							<div class="result" v-show="sorthistory.length > 0">
								<!--<date-picker v-model="time1" valueType="format" placeholder="开始时间" :append-to-body="false"></date-picker>-->
								<!--<p class="title">
									聊天记录
								</p>-->
								<div class="item-girds" v-for="item in sorthistory" :key="item.threadID + 'threadID'">
									<p class="names">
										{{item.name}}
									</p>
									<div @click.stop="_openChatdetail(it.threadID,it.id,it.timestamp)" v-for="it in item.data" :key="it.id" class="allline" :class="{isactive:isSelectitem.id===it.id}">
										<AAlist-item
											:src="it.avatar"
											:title="it.name"
											:desc="it.cForm === 105 ? replacedesc(it.text + it.fileName) : replacedesc(it.text)"
										/>
									</div>
									<div v-show="item.data.length > 3 && !item.nomore" @click="showmorehistory(item)" class="more" :class="{isactive:isSelectitem.id === item.threadID}">
										<div class="info">
											<span>{{$t('search.moreChatHistory')}}</span>
										</div>
										<i class="iconfont iconxiangxia" />
									</div>
									<div class="kongbai"></div>
								</div>
							</div>
							<div class="bg" v-show="sorthistory.length === 0 && activeKey === '4'">
								<div />
								<span>{{$t('search.tip')}}</span>
							</div>
							<!--<div v-show="chathistory.length === 0 && searchText !== '' && sorthistory.length === 0" class="resault-for-number" style="margin: 0px;">
								<span>没有找到关于"<i>{{searchText}}</i>"的结果</span>
							</div>-->
						</div>
					</a-tab-pane>
				</a-tabs>
				<div class="bg" v-show="!searchText && activeKey !== '4'">
					<div />
					<span>{{$t('search.tip')}}</span>
				</div>
				<div v-show="isShowNoData && !isShowVague" class="no-data">
					<div />
					<!--<span>没有找到<br>"<i>{{searchText}}</i>"的结果</span>-->
					<i18n path="search.searchResult" tag="span">
						<template v-slot:keyword>
							<i>{{searchText}}</i>
						</template>
					</i18n>
				</div>
				<div v-show="isLoading" class="loading">
					<a-spin />
				</div>
			</div>
			<!--用户信息卡片-->
			<UserCard :userId="visible === 'showUser' ? userCardParams.userId : null"
				:loading="modalSpinning"
				:comfirmText="userCardParams.comfirmText"
				:comfirm="userCardParams.comfirm"
				:cancel="doClose"
			/>
			<a-modal :title="$t('common.addFriends')"
				class="addFriend"
				:width="420"
				:closable="false"
				@cancel="doClose"
				:visible="visible === 'findUser' || visible === 'addMask'"
			>
				<a-textarea :placeholder="$t('common.leaveMessage')" style="resize:none" v-model="addParams.followMsg" maxlength="20" :rows="4" />
				<template #footer>
					<a-button type="primary" @click="handleAddUser" :loading="modalSpinning">
						{{$t('common.okBtn')}}
					</a-button>
					<a-button @click="doClose">
						{{$t('common.exitBtn')}}
					</a-button>
				</template>
			</a-modal>
			<a-modal :title="$t('common.addFriends')" class="selectUser" :width="420" @cancel="doClose"
				:visible="visible === 'selectUser'"
			>
				<div v-for="(item,index) in selectUserList" :key="'users-'+ index">
					<div @click="showAddUser(item.userId,item.findWay)">
						<AAlist-item class="selectUser-item"
							:title="item.nickName"
							:src="item.userAvatar"
							:desc="`${item.areaCode}<i>${$utils.jsencrypt.Aesdencrypt(item.userMobile, $store.state.User.secretKey)}</i>`"
							:key="'selectUser-' + index"
						/>
					</div>
				</div>
				<template #footer />
			</a-modal>
			<!--搜索发送人-->
			<MultiplePanel
				v-if="selectingFriends"
				:visible="selectingFriends"
				:confirm="onSelectedFriends"
				:cancel="cancleselect"
				limit="10"
				:modeltitle="$t('search.selectSender')"
				:dataType="'friends'"
				class="selectuseres"
				:selectedIds="selectedIds"
			>
			</MultiplePanel>
			<!--创建群聊-->
			<CreatGroup ref="son" style="z-index:1040; position: relative" />
		</div>
		<div class="offOnlineTxt">
			<i class="iconfont iconfasongshibai"></i> {{$t('common.netErrorTip[1]')}}
		</div>
	</div>
</template>

<script>
	import Vue from 'vue'
	import AAlist from '@/components/AAlist/item'
	import UserCard from '@/components/UserCard/index'
	import zh_CN from 'ant-design-vue/es/date-picker/locale/zh_CN'
	import zh_TW from 'ant-design-vue/es/date-picker/locale/zh_TW'
	import en_US from 'ant-design-vue/es/date-picker/locale/en_US'
	import MultiplePanel from '@/components/MultiplePanel'
	import moment from 'moment'
	import 'moment/locale/zh-cn'
	import 'moment/locale/zh-tw'
	import CreatGroup from '@/components/creatgroup/index'
	// import DatePicker from 'vue2-datepicker'
	// import 'vue2-datepicker/index.css'
	// import 'vue2-datepicker/locale/zh-cn'
	const antLanguage = {
		zh_CN,
		zh_TW,
		en_US
	}
	const momentLanguage = {
		'zh_CN': 'zh-cn',
		'zh_TW': 'zh-tw',
		'en_US': 'en'
	}
	export default {
		components: {
			'AAlist-item': AAlist,
			UserCard,
			CreatGroup,
			MultiplePanel
			// DatePicker
		},
		data() {
			return {
				popVisible: false,
				isShowDropdown: false,
				isLoading: false,
				isShowVague: false, // 网络查询
				isShowNoData: false,
				hasChinese: false,
				activeKey: '1',
				searchText: '',
				friendsList: [],
				groupsList: [],
				selectUserList: [],
				chathistory: [],
				sorthistory: [],
				modalSpinning: false,
				visible: '',
				addParams: {
					userId: '',
					followMsg: '',
					way: ''
				},
				popmenu: false,
				userCardParams: {
					userId: '',
					comfirmText: '',
					comfirm: function() {
					}
				},
				allfavoriate: [],
				searcharr: [],
				openselect: true,
				openKeys: ['sub1'],
				selectingFriends: false,
				searchsuerList: [],
				/* 日期筛选器*/
				startValue: null,
				endValue: null,
				endOpen: false,
				locales: {},
				starttiem: null,
				endtime: null,
				chatmore: false,
				selectedIds: '',
				wheres: ``,
				isSelectitem: {
					id: '',
					index: 0,
					data: {}
				},
				keydownarr: [],
				isfocus: false
			}
		},
		computed: {
			// 当计算属性中的某个变量发生改变的时候，会触发计算属性重新计算
			// 所以不能封装封装一整个方法，然后在计算属性里面 return 方法名字
			accountInfo() {
				return this.$store.state.User.accountInfo
			},
			myFriends() { // 我的好友原始数据
				return this.$store.state.MyFriend.list
			},
			users() { // 平台所有用户原始数据
				return this.$store.state.User.list
			},
			myGroups() { // 我的群组原始数据
				return this.$store.state.MyGrounp.list
			},
			myGroupsUsers() { // 我的群组里面所有用户的原始数据
				return this.$store.state.MyGrounp.userRelationList
			},
			myNewFriends() { // 搜索  联系人使用的数据
				const myFriends = this.myFriends
				const users = this.users
				let myNewFriends = []
				if (myFriends.length > 0) {
					myFriends.forEach(friend => {
						users.forEach(user => {
							if (friend.userId === user.userId) {
								const newFriend = Object.assign({}, user, friend)
								myNewFriends.push(newFriend)
							}
						})
					})
				} else myNewFriends = []
				return myNewFriends
			},
			myNewGroups() { // 搜索  我的群组使用的数据
				let myGroups = window._.cloneDeep(this.myGroups) // 深拷贝对象数组
				const myGroupsUsers = window._.cloneDeep(this.myGroupsUsers)
				if (myGroups.length > 0) {
					myGroups.forEach(group => {
						const groupUsers = [] // 存放该群下面的群员
						myGroupsUsers.forEach(groupUser => {
							// 找到该群下面的群员
							if (group.groupId === groupUser.groupId) groupUsers.push(groupUser)
						})
						// 再次去users用户表去合并群员信息
						groupUsers.forEach(item => {
							const userInfo = this.users.find(user => {
								return item.userId === user.userId
							})
							// 还缺少朋友备注label字段，需要去friend列表拿
							let label = ''
							for (let i = 0; i < this.myNewFriends.length; i++) {
								if (this.myNewFriends[i].userId === item.userId) {
									label = this.myNewFriends[i].label
									break
								}
							}
							Object.assign(item, window._.cloneDeep(userInfo))
							Vue.set(item, 'label', label)
						})
						// 还要去friends列表去合并好友备注信息，应为用户信息里面没有备注这个字段
						Vue.set(group, 'groupUsers', groupUsers)
					})
					return myGroups
				} else {
					myGroups = []
					return myGroups
				}
			},
			placeholderText() {
				this.$route.fullPath.indexOf('/collection/') > -1 ? this.$t('search.searchFav') : this.$t('common.search')
				let	result = ''
				if (this.$route.fullPath.indexOf('/collection/') > -1) {
					result = this.$t('search.searchFav')
				} else	if (this.$route.fullPath.indexOf('/files') > -1) {
					result = this.$t('search.searchFile')
				} else {
					result = this.$t('common.search')
				}
				return result
			}
		},
		mounted() {
			this.$refs.searchContainer.addEventListener('keydown', (e) => {
				if (this.isfocus) {
					this._tab(e)
				}
			})
			this.$refs.search.addEventListener('input', this.debounce(e => this._search(this.searchText)))
			this.setLang()
		},
		beforeDestroy() {
			this.$refs.searchContainer.removeEventListener('keydown', (e) => {
				this._tab(e)
			})
			this.$refs.search.removeEventListener('input', this.debounce(e => this._search(this.searchText)))
		},
		watch: {
			'$store.state.Setting.lang'(nVal) {
				this.setLang()
			},
			searchText() {
				if (this.searchText === '') {
					this.chathistory = []
					this.sorthistory = []
					this.$store.dispatch('OPcomponent/set_isSearch', false)
				}
			},
			activeKey() {
				this._focus()
				if (this.activeKey === '1') {
					if (this.searchText === '') {
						return
					} else {
						this.searchallchat(this.searchText, 'all')
					}
				} else if (this.activeKey === '4') {
					this.searchallchat(this.searchText)
				}
				this.switchkey()
				this.isSelectitem.index = 0
				const scollelment = '.scrollwrapper' + this.activeKey
				if (document.querySelector(scollelment)) document.querySelector(scollelment).scrollTop = 0
			}
		},
		methods: {
			setLang() {
				const lang = this.$store.state.Setting.lang
				this.locales = antLanguage[lang]
				moment.locale(momentLanguage[lang])
			},
			creatgroups() {
				this.isfocus = false
				this.popVisible = false
				this.$refs.son.addnewgroup = true
			},
			changefocus() {
				this.isfocus = true
				if (this.$route.fullPath.indexOf('/files') > -1) {
					this.$store.dispatch('Setting/set_showSearchFile', true)
				}
				// this.switchkey()
			},
			switchkey(type) {
				if (this.searchText === '' && this.activeKey !== '4') return
				// 区分是好友，群组，历史记录
				let friendarr = this.friendsList
				friendarr.forEach(item => {
					Vue.set(item, 'searchtype', 'friends')
				})
				let grrouparr = this.groupsList
				grrouparr.forEach(item => {
					Vue.set(item, 'searchtype', 'groups')
				})
				this.keydownarr = this.keydownarr.splice(0)
				switch (this.activeKey) {
				case '1':
					let hsiarr = this.chathistory
					hsiarr.forEach(item => {
						Vue.set(item, 'searchtype', 'history')
					})
					//	当每个类型筛选内容大于3时，给每个分类的最后面加个加载更多并区分回车加载更多时，加载的是好友，群组，历史记录
					if (this.friendsList.length > 3) {
						friendarr = window._.cloneDeep(this.friendsList).slice(0, 3)
						friendarr.push({ id: 'morefriend' })
					}
					if (this.groupsList.length > 3) {
						grrouparr = window._.cloneDeep(this.groupsList).slice(0, 3)
						grrouparr.push({ id: 'moremygroup' })
					}
					if (this.chathistory.length > 3) {
						hsiarr = window._.cloneDeep(this.chathistory).slice(0, 3)
						hsiarr.push({ id: 'morechathistory' })
					}
					this.keydownarr = [...friendarr, ...grrouparr, ...hsiarr]
					if (this.isShowVague) this.keydownarr.push({ id: 'searchbyonline' })
					if (this.friendsList.length > 0) {
						this.isSelectitem.id = this.friendsList[0].id || ''
						this.isSelectitem.data = this.friendsList[0] || {}
					} else if (this.friendsList.length === 0 && this.groupsList.length > 0) {
						this.isSelectitem.id = this.groupsList[0].groupId || ''
						this.isSelectitem.data = this.groupsList[0] || {}
					} else if (this.friendsList.length === 0 && this.groupsList.length === 0 && this.chathistory.length > 0) {
						this.isSelectitem.id = this.chathistory[0].id || ''
						this.isSelectitem.data = this.chathistory[0] || {}
					} else {
						this.isSelectitem.id = 'searchbyonline'
						this.isSelectitem.data = {}
					}
					break
				case '2':
					this.keydownarr = window._.cloneDeep(this.friendsList)
					this.isSelectitem.id = this.friendsList.length > 0 ? this.friendsList[0].id : 'searchbyonline'
					this.isSelectitem.data = this.friendsList.length > 0 ? this.friendsList[0] : {}
					if (this.isShowVague) this.keydownarr.push({ id: 'searchbyonline' })
					break
				case '3':
					this.keydownarr = window._.cloneDeep(this.groupsList)
					this.isSelectitem.id = this.groupsList.length > 0 ? this.groupsList[0].groupId : ''
					this.isSelectitem.data = this.groupsList.length > 0 ? this.groupsList[0] : {}
					break
				case '4':
					this.keydownarr = []
					const sorthisarr = window._.cloneDeep(this.sorthistory)
					if (sorthisarr.length > 0) {
						sorthisarr.forEach(item => {
							if (!item.nomore) {
								item.data.push({ id: item.threadID, showmorhis: true, data: item })
							}
							item.data.forEach(it => {
								Vue.set(it, 'searchtype', 'history')
							})
							this.keydownarr = [...this.keydownarr, ... item.data]
						})
						if (type === '1') {
							this.isSelectitem.id = this.keydownarr[this.isSelectitem.index].id
							this.isSelectitem.data = this.keydownarr[this.isSelectitem.index]
						} else {
							this.isSelectitem.id = sorthisarr[0].data[0].id
							this.isSelectitem.data = sorthisarr[0].data[0]
						}
					} else {
						this.isSelectitem.id = ''
					}
					break
				}
			},
			keyupchange(val) {
				const scollelment = '.scrollwrapper' + this.activeKey
				if (this.keydownarr.length === 0) return
				if (val.code === 'ArrowUp') {
					if (this.isSelectitem.index <= 1 && document.querySelector(scollelment)) {
						document.querySelector(scollelment).scrollTop = 0
					} else if (this.activeKey === '3' && this.isSelectitem.index <= 5) {
						document.querySelector(scollelment).scrollTop = 0
					}
					document.querySelector('.isactive').scrollIntoView(false)
					if (this.isSelectitem.index === 0) return
					this.isSelectitem.index -= 1
					this.isSelectitem.id = this.keydownarr[this.isSelectitem.index].id || this.keydownarr[this.isSelectitem.index].groupId
					this.isSelectitem.data = this.keydownarr[this.isSelectitem.index]
				} else if (val.code === 'ArrowDown') {
					if (this.activeKey === '4' && this.isSelectitem.index >= 1 && document.querySelector(scollelment)) {
						document.querySelector(scollelment).scrollTop = (this.isSelectitem.index + 1) * 60
					} else if (this.activeKey === '3' && this.isSelectitem.index >= 5) {
						document.querySelector(scollelment).scrollTop = this.isSelectitem.index * 62
					}
					document.querySelector('.isactive').scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' })
					// document.querySelector(scollelment).scrollTop += 20
					if (this.isSelectitem.index === this.keydownarr.length - 1) return
					this.isSelectitem.index += 1
					this.isSelectitem.id = this.keydownarr[this.isSelectitem.index].id || this.keydownarr[this.isSelectitem.index].groupId
					this.isSelectitem.data = this.keydownarr[this.isSelectitem.index]
				} else if (val.code === 'Enter') {
					if (this.isSelectitem.data.showmorhis) {
						this.showmorehistory(this.isSelectitem.data.data, '2')
						return
					}
					switch (this.isSelectitem.id) {
					case 'morefriend':
						this.activeKey = '2'
						break
					case 'moremygroup':
						this.activeKey = '3'
						break
					case 'morechathistory':
						this.activeKey = '4'
						break
					case 'searchbyonline':
						this._findUser()
						break
					}
					if (this.isSelectitem.data.searchtype === 'friends') {
						this._openChat(this.isSelectitem.data.groupId, -1)
					} else if (this.isSelectitem.data.searchtype === 'groups') {
						this._openChat(this.isSelectitem.data.groupId, this.isSelectitem.data.temporaryFlag)
					} else if (this.isSelectitem.data.searchtype === 'history') {
						this._openChatdetail(this.isSelectitem.data.threadID, this.isSelectitem.data.id, this.isSelectitem.data.timestamp)
					}
				}
			},
			openselectuser() {
				this.selectedIds = ''
				if (this.searchsuerList.length > 0) {
					this.searchsuerList.forEach(item => {
						this.selectedIds += item.groupId + '|'
					})
				}
				this.selectingFriends = true
			},
			showmorehistory(item, type) {
				// 根据最后一条的时间去查询后续的历史
				// 用type区分是回车还是点击 type -- 回车
				let lasttime = ''
				// const lasttime = item.data[item.data.length - 1].timestamp
				type ? lasttime = item.data[item.data.length - 2].timestamp : lasttime = item.data[item.data.length - 1].timestamp
				this.searchallchat(this.searchText, item, lasttime)
			},
			_openChatdetail(threadID, id, timestamp) {
				this.$store.dispatch('Chat/switchThread', {
					threadID,
					scrollTo: {
						threadID,
						id,
						timestamp
					}}).then(res => {
					this._hideDropdown()
					this.$nextTick(() => {
						this.resetselect()
					})
				})
			},
			resetselect() {
				this.startValue = null
				this.endValue = null
				this.searchsuerList = []
				this.starttiem = null
				this.endtime = null
				this.sorthistory = []
				this.keydownarr = []
				if (this.searchText) {
					this.searchallchat(this.searchText)
				}
			},
			async searchallchat(word, size, time) {
				if (this.searchText === '' && this.searchsuerList.length === 0) {
					this.chathistory = []
					this.sorthistory = []
					return
				}
				if (this.searchText === '' && this.searchsuerList.length > 0 && !time) {
					this.sorthistory = []
				}
				word = word.replace('%', '/%')
				word = word.replace('_', '/_')
				const searchWords = word
				let sender = ''
				this.wheres = ``
				// const threadIDs = ''
				// const ischinaese = new RegExp('[\\u4E00-\\u9FFF]+', 'g').test(word)
				// if (ischinaese) searchWords = encodeURIComponent(word).replace(/%/g, '\\%')

				let startTime = this.starttiem || 0
				let endTime = time - 1 || this.endtime || 4112576535000

				// 产品需求，切回全部页要重置筛选条件
				if (size === 'all') {
					startTime = 0
					endTime = 4112576535000
				}
				// 公用的搜索的条件
				// 1.8先过滤语音通话记录cForm106，后续去掉
				// const publicwheres = `cForm!=53 and cForm!=106 and cForm!=108 and cForm!=109 and cForm!=110 and threadType!=10001 and ((burntAfterRead=1 and isSend=1) or (burntAfterRead=0) or (burntAfterRead=1 and triggered=1)) and timestamp>=${startTime} and timestamp<=${endTime}`
				const publicwheres = `cForm not in (53,106,108,109,110,114) and threadType!=10001 and ((burntAfterRead=1 and isSend=1) or (burntAfterRead=0) or (burntAfterRead=1 and triggered=1)) and timestamp>=${startTime} and timestamp<=${endTime}`

				if (this.searchsuerList.length >= 1 && size !== 'all') {
					this.searchsuerList.forEach(item => {
						sender += "'" + item.userId + "'" + ','
					})
					sender = sender.substr(0, sender.length - 1)
					if (searchWords) {
						this.wheres = `${publicwheres} and (senderID in (${sender}) and isAnoymous!=1) and (text like ? escape '/' or data like ? escape '/')`
					} else {
						this.wheres = `${publicwheres} and (senderID in (${sender}) and isAnoymous!=1)`
					}
				} else {
					if (searchWords) {
						this.wheres = `${publicwheres} and (text like ? escape '/' or data like ? escape '/')`
					} else {
						this.wheres = `${publicwheres}`
					}
				}
				const sockobj = {}
				let sockarr = ''
				this.myGroups.forEach(group => {
					if (group.state === 0) {
						sockarr += "'" + group.groupId + "'" + ','
						this.$set(sockobj,	group.groupId, 'suoding')
					}
				})
				sockarr = sockarr.substr(0, sockarr.length - 1)
				// 聊天选中全部时只搜索前4条并且不作分组处理
				if (this.activeKey === '1') {
					this.$utils.sqlite.getChatData({
						// where: this.wheres,
						where: `threadID not in (${sockarr}) and ${this.wheres}`,
						order: 'timestamp desc',
						/* eslint-disable quotes */
						size: 4,
						params: searchWords ? ["%" + searchWords + "%", `%fileName%${searchWords}%`] : []
					}).then(res => {
						if (res.length > 4) {
							this.chatmore = true
						} else {
							this.chatmore = false
						}
						this.chathistory = res
						this.switchkey()
						if (res.length > 0) this._judge()
					})
				}

				// 在此做分页与分组处理
				// 在聊天记录页点击更多聊天记录，分页查询，每页10条
				if (time && this.activeKey === '4') {
					let nextdata = []
					nextdata = await this.$utils.sqlite.getChatData({
						where: `threadID='${size.threadID}' and ${this.wheres}`,
						order: 'timestamp desc',
						size: time ? 10 : 4,
						/* eslint-disable quotes */
						params: searchWords ? ["%" + searchWords + "%", `%fileName%${searchWords}%`] : []
					})
					this.sorthistory.forEach(sort => {
						if (sort.threadID === size.threadID) {
							if (sort.allcount <= nextdata.length + sort.data.length) Vue.set(sort, 'nomore', true)
							sort.data = [...sort.data, ...nextdata]
						}
					})
					this.switchkey('1')
				}
				if (this.activeKey === '4' && !time) {
					// 首先查询出所有包含查询内容的会话，并每个会话查询3条
					// 查询分组及其包含的数据量
					const threads = await this.$utils.sqlite.getChatData({
						select: 'threadID,count(*) as count',
						where: this.wheres,
						groupBy: 'threadID',
						order: 'timestamp desc',
						/* eslint-disable quotes */
						params: searchWords ? ["%" + searchWords + "%", `%fileName%${searchWords}%`] : []
					})

					const searchResult = []
					this.sorthistory = []
					if (threads.length > 0) {
						let thread
						let threadInfo
						let data
						for (let i = 0; i < threads.length; i++) {
							thread = threads[i]
							if (!sockobj[thread.threadID]) {
								let nomore = false
								if (thread.count <= 4) {
									nomore = true
								}

								data = await this.$utils.sqlite.getChatData({
									where: `threadID='${thread.threadID}' and ${this.wheres}`,
									order: 'timestamp desc',
									size: time ? 10 : 4,
									/* eslint-disable quotes */
									params: searchWords ? ["%" + searchWords + "%", `%fileName%${searchWords}%`] : []
								})

								threadInfo = this.$store.getters['Chat/someThread'](thread.threadID)

								searchResult.push({
									threadID: thread.threadID,
									name: threadInfo.name,
									data,
									nomore,
									allcount: thread.count
								})
							}
						}
					}
					this.sorthistory = searchResult
					if (this.activeKey === '4') this.switchkey()
				}
			},
			replacedesc(string) {
				return this.$utils.colourStr(string, this.searchText)
			},
			onSelectedFriends(list) {
				this.searchsuerList = window._.cloneDeep(list)
				this.searchallchat(this.searchText)
				this.selectingFriends = false
			},
			cancleselect() {
				this.selectingFriends = false
			},
			morehistory(type) {
				this.activeKey = '4'
			},
			// 日期筛选器相关方法
			disabledStartDate(startValue) {
				const endValue = this.endValue
				let tomorrow = new Date(moment().endOf("day")._d)
				tomorrow = tomorrow.getFullYear() + '-' + (tomorrow.getMonth() + 1) + '-' + tomorrow.getDate() + ' ' + tomorrow.getHours() + ':' + tomorrow.getMinutes() + ':' + tomorrow.getSeconds()
				const notselectdata = new Date(tomorrow).getTime()
				if (!startValue || !endValue) {
					return startValue.valueOf() > notselectdata
				} else {
					return startValue.valueOf() > endValue.valueOf()
				}
				// return startValue && moment().endOf("day") < startValue
			},
			disabledEndDate(endValue) {
				const startValue = this.startValue
				let tomorrow = new Date(moment().endOf("day")._d)
				tomorrow = tomorrow.getFullYear() + '-' + (tomorrow.getMonth() + 1) + '-' + tomorrow.getDate() + ' ' + tomorrow.getHours() + ':' + tomorrow.getMinutes() + ':' + tomorrow.getSeconds()
				const notselectdata = new Date(tomorrow).getTime()
				if (!endValue || !startValue) {
					return endValue.valueOf() > notselectdata
				} else {
					return startValue.valueOf() >= endValue.valueOf() || endValue.valueOf() > notselectdata
				}
			},
			openDatepick() {
				// this.disabledStartDate()
				setTimeout(() => {
					if (document.querySelector('.ant-calendar-input-wrap')) {
						document.querySelector('.ant-calendar-input-wrap').style.display = 'none'
					}
				}, 100)
			},
			handleStartOpenChange(value, mode) {
				if (this.searchText === '' && this.searchsuerList.length === 0) {
					this.chathistory = []
					this.$message.warning('请添加发送人或输入关键字后筛选聊天记录')
					return
				}
				// 日期选择默认选择的是当前时间，要将其设为当前0点
				if (mode.length > 10) {
					mode = mode.substr(0, 11) + '00:00:00'
				} else {
					mode = mode + ' 00:00:00'
				}
				const datatime = new Date(mode)
				const times = datatime.valueOf(datatime)
				this.starttiem = times
				this.searchallchat(this.searchText)
			},
			handleEndOpenChange(value, mode) {
				if (this.searchText === '' && this.searchsuerList.length === 0) {
					this.chathistory = []
					this.$message.warning('请添加发送人或输入关键字后筛选聊天记录')
					return
				}
				if (mode.length > 10) {
					mode = mode.substr(0, 11) + '23:59:59'
				} else {
					mode = mode + ' 23:59:59'
				}
				const datatime = new Date(mode.substr(0, 11) + '23:59:59')
				const times = datatime.valueOf(datatime)
				this.endtime = times
				this.searchallchat(this.searchText)
			},
			// async getsdkfariovelist(word) {
			// 	修改搜索收藏，去掉sdk搜索，只用本地搜索
			// 	if (this.$store.getters['Setting/isOnline']) {
			// 		this.farioverList = await this.$store.dispatch('Chat/getFavorite', {
			// 			word: word,
			// 			minTime: '0',
			// 			from: 0
			// 		})
			// 	} else {
			// 		const searchText = encodeURI(word)
			// 		this.farioverList = await this.$utils.sqlite.getCollectData({ size: 100, order: 'time desc', where: `meta like '%${searchText}%' or content like '%${searchText}%'` })
			// 	}
			// 	this.$store.commit('Chat/getcollectList', this.farioverList)
			// 	let index = 1
			// 	this.$utils.sqlite.getCollectData({ size: 20, order: 'time desc', index: index }).then(async res => {
			// 		if (res.length === 20) {
			// 			index++
			// 		}
			// 	})
			// 	this.getcollect(word)
			// },
			moveImg: function(value) {
				if (!value) return ''
				value = value.replace(/<[^>]+>|&[^>]+;/g, '').trim()
				return value
			},
			getcollect(word) {
				this.$utils.sqlite.getCollectData({ size: 999999, order: 'time desc' }).then(res => {
					this.allfavoriate = window._.cloneDeep(res)
					const reg = new RegExp(this.$utils.formatReg(word), 'i')
					const _test = str => reg.test(str)
					this.searcharr = []
					this.searcharr.length = 0
					this.$store.dispatch('OPcomponent/set_isSearch', true)
					if (this.searchText && this.allfavoriate.length > 0) {
						this.allfavoriate.forEach(item => {
							switch (item.form) {
							case this.$CHAT_MSG_TYPE.TYPE_TEXT:
							case this.$CHAT_MSG_TYPE.TYPE_NOTE:
								if (_test(this.moveImg(item.content)) || _test(item.meta.nickName)) {
									this.searcharr.push(item)
								}
								break
							case this.$CHAT_MSG_TYPE.TYPE_IMAGE:
							case this.$CHAT_MSG_TYPE.TYPE_VOICE:
							case this.$CHAT_MSG_TYPE.TYPE_VIDEO:
								if (_test(item.meta.nickName)) {
									this.searcharr.push(item)
								}
								break
							case this.$CHAT_MSG_TYPE.TYPE_FILE:
								if (_test(item.meta.nickName) || _test(item.meta.fileName)) {
									this.searcharr.push(item)
								}
							}
						})
						this.$store.commit('Chat/getcollectList', this.searcharr)
						this.searcharr = []
					} else {
						this.$store.dispatch('OPcomponent/set_isSearch', false)
						this.$store.commit('Chat/getcollectList', this.allfavoriate)
					}
				})
			},
			_openChat(id, type) { // type: 0:私聊  1:群聊  2:临时聊天
				const chatId = id
				const chatType = type + 1 // 考虑到群会话本身带有0和1参数来识别简单群聊还是临时群聊，所以这边参数加1
				this.$store.dispatch('Chat/openThread', { id: chatId, type: chatType }).then(res => {
					this._hideDropdown()
				})
			},
			_search() {
				if (this.$route.fullPath.indexOf('/collection/') > -1) {
					// this.getsdkfariovelist(this.searchText)
					this.getcollect(this.searchText)
				} else if (this.$route.fullPath.indexOf('/files') > -1)	{
					// this.$store.dispatch('Setting/set_searchFileKeyword', this.searchText)
				} else {
					this.searchallchat(this.searchText)
					const searchText = this.searchText
					const reg = new RegExp(this.$utils.formatReg(searchText), 'i')
					const myNewFriends = window._.cloneDeep(this.myNewFriends)
					const myNewGroups = window._.cloneDeep(this.myNewGroups)
					// const _replace = string => {
					// 	// 保存符合匹配规则的原字符串具体值:原字符串为'AbcDe',搜索'abc',则matchList = ['A', 'b', 'c']
					// 	// 目的是防止原字符串大小写被搜索内容替换掉
					// 	const matchList = string.match(new RegExp(this.$utils.formatReg(searchText), 'gi'))
					// 	if (isNaN(searchText)) {
					// 		if (matchList) {
					// 			for (var j = 0; j < matchList.length; j++) {
					// 				string = string.replace(matchList[j], '[*' + j + '*]')
					// 			}
					// 			for (var i = 0; i < matchList.length; i++) {
					// 				string = string.replace('[*' + i + '*]', '<i style="color: #2D7BFF">' + matchList[i] + '</i>')
					// 			}
					// 		}
					// 	} else {
					// 		string = string.replace(reg, '<i style="color: #2D7BFF">' + searchText + '</i>')
					// 	}
					// 	return string
					// }
					const _replace = string => {
						return this.$utils.colourStr(string, this.searchText)
					}
					const _test = str => reg.test(str)
					let title = ''
					let desc = ''
					let gTitle = ''
					let gDesc = '包含：'
					const _set = object => {
						Vue.set(object, 'title', title)
						Vue.set(object, 'desc', desc)
						this.friendsList.push(object)
					}
					const _setGroup = object => {
						Vue.set(object, 'title', gTitle)
						Vue.set(object, 'desc', gDesc)
						this.groupsList.push(object)
					}
					this.friendsList = []
					this.groupsList = []
					if (searchText) {
						this.hasChinese = new RegExp('[\\u4E00-\\u9FFF]+', 'g').test(searchText) // 是否存在中文
						if (!this.hasChinese) this.isShowVague = true
						else this.isShowVague = false
						this.isLoading = true
						this.$utils.fun.waiting(300).then(() => { // 为了loading交互效果
							// 查找联系人
							myNewFriends.forEach(f => {
								// 备注有关键字，只显示备注
								title = ''
								desc = ''
								if (_test(f.label)) {
									title = _replace(f.label)
									_set(f)
								} else if (_test(f.nickName)) {
									if (f.label) {
										// 昵称有关键字，并且有备注，则上面显示备注，下面显示昵称
										title = _replace(f.label)
										desc = this.$t('userCard.nickname') + '：' + _replace(f.nickName)
										_set(f)
									} else {
										title = _replace(f.nickName)
										_set(f)
									}
								} else if (_test(f.accountCode) && !f.label) {
									// id有关键字，并且未备注，显示昵称、AAid
									title = _replace(f.nickName)
									const AAname = 'ID：'
									desc = AAname + _replace(f.accountCode)
									_set(f)
								} else if (_test(f.accountCode) && f.label) {
									// AAid有关键字，并且有备注，显示备注、AAid
									title = _replace(f.label)
									desc = 'ID：' + _replace(f.accountCode)
									_set(f)
								} else if (_test(f.userMobile)) {
									if (f.label) {
										// 手机号有关键字，并却又备注，显示备注、手机号
										title = _replace(f.label)
										desc = this.$t('common.mobileNumber') + '：' + _replace(f.userMobile)
										_set(f)
									} else {
										// 手机号有关键字，并却又未备注，显示昵称、手机号
										title = _replace(f.nickName)
										desc = this.$t('common.mobileNumber') + '：' + _replace(f.userMobile)
										_set(f)
									}
								}
							})
							// 查找群组
							myNewGroups.forEach(g => {
								// 群名称有关键字，只显示群名称
								if (g.state === 0) {
									return
								} else if (_test(g.groupName)) {
									gTitle = _replace(g.groupName)
									gDesc = ''
									_setGroup(g)
								} else {
									// 群成员保护模式下，非管理员/群主不能通过群成员信息搜索到群
									if (g.privacyProtection === 1) {
										const	selfInfo = g.groupUsers.find(user => user.userId == this.accountInfo.userId)
										if (!selfInfo || selfInfo.adminFlag == 0) return
									}
									gDesc = '包含：'
									// 查找群成员信息是否有关键字
									gTitle = _replace(g.groupName)
									g.groupUsers.forEach(u => {
										// 群成员备注有关键字
										if (_test(u.label)) {
											gDesc += _replace(u.label) + '、'
										} else if (_test(u.userLabel) && u.userLabel && u.label) {
											// 群成员在群里的备注有关键字
											gDesc += u.label + '(' + _replace(u.userLabel) + ') 、'
										} else if (_test(u.userLabel) && u.userLabel && !u.label) {
											// 群成员在群里的备注有关键字
											gDesc += _replace(u.userLabel) + ' 、'
										} else if (_test(u.nickName) && !u.label && !u.userLabel) {
											// 群成员昵称有关键字，并且两种都没备注
											gDesc += _replace(u.nickName) + '、'
										} else if (_test(u.nickName) && u.label) {
											// 群成员昵称有关键字，并且在好友有备注
											gDesc += u.label + '(' + _replace(u.nickName) + ') 、'
										} else if (_test(u.nickName) && u.userLabel) {
											// 群成员昵称有关键字，并且在群里有备注
											gDesc += u.userLabel + '(' + _replace(u.nickName) + ') 、'
										} else if (_test(u.accountCode) && !u.userLabel && !u.label) {
											// AAid有关键字，并且两种都未备注
											gDesc += _replace(u.nickName) + '(' + _replace(u.accountCode) + ')' + '、'
										} else if (_test(u.accountCode) && u.label) {
											// AAid有关键字，并且有好友备注
											gDesc += _replace(u.label) + '(' + _replace(u.accountCode) + ')' + '、'
										} else if (_test(u.accountCode) && u.userLabel) {
											// AAid有关键字，并且群里有备注
											gDesc += _replace(u.userLabel) + '(' + _replace(u.accountCode) + ')' + '、'
										} else if (u.userLabel && _test(u.userLabel) && !u.label) {
											// 群备注有关键字，但是没有好友备注
											gDesc += _replace(u.userLabel) + '(' + u.nickName + ') 、'
										} else if (_test(u.userMobile)) {
											// 如果群成员手机有关键字，优先显示还有备注加手机，在显示群备注、昵称加手机
											if (u.label) gDesc += _replace(u.label) + '(' + _replace(u.userMobile) + ')' + '、'
											else if (u.userLabel) gDesc += _replace(u.userLabel) + '(' + _replace(u.userMobile) + ')' + '、'
											else gDesc += _replace(u.nickName) + '(' + _replace(u.userMobile) + ')' + '、'
										}
									})
									// 需要判断上面条件是否有符合的
									if (gDesc.length > 3) {
										gDesc = gDesc.substring(0, gDesc.length - 1)
										_setGroup(g)
									}
								}
							})
							this.switchkey()
							this.isSelectitem.index = 0
							this.isLoading = false
							this._judge()
							/* setTimeout(() => {
								this._judge()
							}, 1500)*/
						}).catch(res => { this.isLoading = false })
						// 搜索内容为纯中文，并且没有结果显示
					} else {
						this.isShowVague = false
						this.isShowNoData = false
						this.friendsList = []
						this.groupsList = []
					}
				}
			},
			handleAddUser() { // 发送添加好友申请
				this.modalSpinning = true
				this.$utils.api.user.applyAddFriend(this.addParams).get().then(res => {
					this.modalSpinning = false
					this.doClose()
					this.$message.success(res.data.joinState == 2 ? this.$t('common.alreadyFriends') : this.$t('common.sendSuccessfully'))
				}).catch((e) => {
					this.modalSpinning = false
				})
			},
			_findUser() {
				this.isShowDropdown = false
				const reg = /^\s+$/
				if (this.searchText.match(reg)) return this.$message.warning('查无数据')
				this.modalSpinning = true
				this.$utils.api.user.findUsers({ searchText: this.searchText }).get().then(res => {
					this.modalSpinning = false
					if (res.data.list.length < 1) { // 注册不同区号的同一手机号会是多个用户
						this.searchText = ''
						return this.$message.error(this.$t('search.noFindTips'))
					} else if (res.data.list.length == 1) {
						this.showAddUser(res.data.list[0].userId, res.data.list[0].findWay)
					} else {
						this.selectUserList = res.data.list || []
						this.visible = 'selectUser'
					}
				}).catch((e) => {
					this.modalSpinning = false
				})
				this.$refs.search.blur()
				this.searchText = ''
			},
			openAddFriendsWin() {
				this.popVisible = false
				this.$eventBus.$emit('openAddFriendsWin')
			},
			showAddUser(userId, way) { // 展示查找用户的结果
				this.addParams.userId = userId
				//        let _this = this
				//        this.userCardParams = {
				//          userId: userId,
				//          comfirmText: _this.$t('common.addFriends'),
				//          comfirm: () => {
				//            _this.visible = 'addMask'
				//            _this.addParams.way = way || ''
				//            _this.addParams.followMsg = '我是' + this.accountInfo.nickName
				//          }
				//        }
				this.userCardParams = {
					userId: userId,
					comfirmText: '',
					comfirm: '',
					way: way || ''
				}
				if (this.onlineCheck()) this.visible = 'showUser'
			},
			doClose() {
				this.visible = ''
				this.modalSpinning = false
			},
			// 防抖
			debounce(fn, timeout = 500) {
				let timer
				return (...args) => {
					if (timer) clearTimeout(timer)
					timer = setTimeout(() => {
						fn.apply(fn, args)
					}, timeout)
				}
			},
			_tab(e) {
				if (this.selectingFriends) return
				if (this.isShowDropdown) {
					if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
						this._focus()
						return
					}
					this._focus()
					if (e.keyCode === 9) {
						if (this.activeKey === '1') this.activeKey = '2'
						else if (this.activeKey === '2') this.activeKey = '3'
						else if (this.activeKey === '3') this.activeKey = '4'
						else if (this.activeKey === '4') this.activeKey = '1'
					}
					this._judge()
				}
			},
			_judge() {
				switch (this.activeKey) {
				case '1':
					if (this.friendsList.length === 0 && this.groupsList.length === 0 && this.chathistory.length === 0 && this.searchText !== '') this.isShowNoData = true
					else this.isShowNoData = false
					break
				case '2':
					if (this.friendsList.length === 0 && this.hasChinese && this.searchText !== '') this.isShowNoData = true
					else this.isShowNoData = false
					break
				case '3':
					if (this.groupsList.length === 0 && this.hasChinese && this.searchText !== '') this.isShowNoData = true
					else this.isShowNoData = false
					break
				case '4':
					this.isShowNoData = false
					break
				}
			},
			callback(key) {
				this.activeKey = key
				this._judge()
			},
			_hideDropdown() {
				localStorage.setItem('searchText', this.searchText)
				this.isShowDropdown = false
				this.searchText = ''
				// this.$store.dispatch('Setting/set_searchFileKeyword', '')
				this.isShowVague = false
				this.isShowNoData = false
				this.friendsList = []
				this.groupsList = []
				this.isfocus = false
				this.$refs.search.blur()
			},
			_showDropdown() {
				if (!(this.$route.fullPath.indexOf('/collection/') > -1) && !(this.$route.fullPath.indexOf('/files') > -1)) {
					this.isShowDropdown = true
				}
				// 上次搜索框有值的时候需要回显
				const searchText = localStorage.getItem('searchText')
				if (searchText !== undefined && !this.searchText && searchText !== null) this.searchText = searchText
				if (this.searchText && !this.isLoading) this.debounce(this._search(this.searchText), 1000)
			},
			_focus() {
				this.$refs.search.focus()
			}
		}
	}
</script>

<style lang="scss" scoped>
	.popmenu{
		cursor: pointer;
		line-height: 38px;
		white-space: nowrap;
		.iconfont{
			margin-right:8px;
		}
		&:hover{
			color:#2E87FF;
		}
	}
	.search-offonline{
		.offOnlineTxt{
			height: 0px;
			background-color: #ffe9e5;
			color:#ff7257;
			display: flex;
			align-items: center;
			font-size:12px;
			padding-left: 13px;
			transition: height .3s;
			overflow: hidden;
			font-weight: 400;
			i{
				margin-right: 7px;
				font-size: 20px;
			}
		}
		.search-container {
			position: relative;
			height: 80px;
			border-bottom: 1px solid #f0f0f0;
			.ipt-wrapper {
				-webkit-app-region: drag;
				position: relative;
				padding:0 13px;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: space-between;
				input::-webkit-input-placeholder {
					color: #999;
					font-size: 12px;
				}
				.iconsousuo{
					position: relative;
					&:before{
						position: absolute;
						top:9px;
						left: 9px;
						color:#a3a3a3
					}
				}
				input {
					-webkit-app-region:no-darg;
					display: block;
					width: 182px;
					height: 35px;
					border-radius: 18px;
					padding: 0 10px 0 30px;
					font-size: 12px;
					color: #333;
					background: #fff;
					border: 1px solid rgba(240, 240, 240, 1);
					&:focus {
						outline: none;
					}
				}
				i {
					width: 35px;
					height: 35px;
					border-radius: 50%;
					border: 1px solid rgba(240, 240, 240, 1);
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					font-size: 18px;
				}
				.iconjia{
					-webkit-app-region: no-drag;
				}
			}
			.dropdown {
				position: absolute;
				top: 60px;
				left: 13px;
				width: 320px;
				height: 500px;
				background: #fff;
				border: 1px solid rgba(229, 229, 229, 1);
				border-radius: 4px;
				box-shadow: 0px 1px 16px 0px rgba(0, 0, 0, 0.2);
				z-index: 5;
				/deep/ .ant-tabs-bar {
					margin: 0;
				}
				/deep/ .ant-tabs-nav {
					margin-left: 12px;
				}
				/deep/ .ant-tabs-tab {
					padding: 9px 0;
				}
				.scroll-wrapper {
					overflow-y: auto;
					overflow-x: hidden;
					height: 460px;
					padding-bottom: 30px;
					.result {
						user-select: none;
						.title {
							height: 36px;
							margin: 0 0 0 14px !important;
							background: #fff;
							border-bottom: 1px solid #E6E6E6;
							color: #999;
							font-size: 14px;
							line-height: 36px;
							text-align: left;
						}
						.item-gird {
							padding-left: 16px;
							&:hover {
								background: #E6E6E6;
							}
							.AAlist-item {
								padding: 9px 0;
								cursor: pointer;
							}
						}
						.item-girds{
							padding-left: 16px;
							.names{
								padding-top: 10px;
							}
							.allline{
								margin-left: -16px;
								&:hover{
									background: #F5F6F7;
								}
							}
							.AAlist-item{
								border-bottom: none;
								border-top: 1px solid #E6E6E6;
								margin-left: 16px;
								width: 300px;
							}
							.kongbai{
								width: 320px;
								height: 14px;
								background: #F5F6F7;
								margin-left: -15px;
							}
							&:first-of-type{
								.names{
									padding-top: 0px;
								}
							}
							&:last-of-type{
								.kongbai{
									height: 0px;
								}
							}
							.more{
								margin-left: -16px;
							}
						}
						/deep/ .meta-title {
							font-size: 14px;
							line-height: 22px;
						}
						/deep/ .meta-description {
							font-size: 14px;
							line-height: 22px;
							color: #999;
						}
						.more {
							display: flex;
							justify-content: space-between;
							align-items: center;
							height: 40px;
							padding: 0 18px;
							background: #fff;
							border-bottom: 1px solid #E6E6E6;
							cursor: pointer;
							&:hover {
								background: #E6E6E6;
							}
							div {
								color: #2E87FF;
								font-size: 12px;
								i {
									margin-right: 5px;
								}
							}
							i {
								font-size: 11px;
								color: #2E87FF;
							}
							.iconsousuo{
								font-size: 13px;
								margin-right: 0px;
							}
						}
					}
					.block-seat {
						height: 14px;
						background: #F5F6F7;
					}
					.network-search {
						height: 36px;
						margin-left: 16px;
						border-bottom: 1px solid #E6E6E6;
						font-size: 14px;
						color: #999;
						line-height: 36px;
						margin-bottom: 0px;
					}
					.resault-for-number {
						overflow: hidden;
						margin: 0 16px;
						font-size: 14px;
						line-height: 22px;
						color: #999;
						/*border-bottom: 1px solid #E6E6E6;*/
						span {
							display: block;
							margin: 20px 0;
							i {
								color: #2E87FF;
								word-break: break-all;
							}
						}
					}
					.number-search {
						position: relative;
						height: 62px;
						text-align: left;
						cursor: pointer;
						width: 100%;
						display: flex;
						align-items: center;
						&:hover {
							background: #E6E6E6;
						}
						&::before {
							content: '';
							position: absolute;
							top: 61px;
							left: 16px;
							width: 304px;
							height: 1px;
							background: #E6E6E6
						}
						.add {
							width: 43px;
							height: 43px;
							margin: 0 14px 0 16px;
							font-size: 30px;
							line-height: 43px;
							text-align: center;
							background: #2E87FF;
							border-radius: 50%;
							color: #fff;
						}
						div {
							width: 216px;
							text-align: left;
							font-size: 14px;
							.name {
								display: block;
								line-height: 120%;
								color: #333;
								width: 100%;
								overflow: hidden;
								text-overflow: ellipsis;
								white-space: nowrap;
							}
							.other {
								display: block;
								color: #2E87FF;
								width: 100%;
								overflow: hidden;
								text-overflow: ellipsis;
								white-space: nowrap;
							}
						}
						.arrow {
							font-size: 14px;
						}
					}
					.selectsesson{
						width: 298px;
						margin: 15px auto;
						border: 1px solid #E5E5E5;
						padding-left: 15px;
						background: #FFFFFF;
						/*transition: max-height 1s;*/
						.selecttitle{
							height: 38px;
							border-top: 1px solid #E5E5E5;
							line-height: 38px;
							color: #999999;
							font-size: 12px;
							width: 280px;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
							&:nth-of-type(1), &:last-of-type{
								border-top: none;
							}
							&:nth-of-type(4){
								border-bottom: 1px solid #E5E5E5;
							}
							.right{
								margin-left: 154px;
								cursor: pointer;
								.iconfont{
									font-size: 12px !important;
								}
							}
							.username{
								color: #333333;
							}
						}
						.lastrest{
							text-align: center;
							cursor: pointer;
							font-size: 12px;
							width: 296px;
							margin-left: -15px;
							&:hover{
								background: #F5F6F7;
							}
						}
						/deep/ .ant-calendar-picker{
							width: 281px !important;
							.ant-calendar-picker-input{
								border: none;
								padding-left: 0px;
							}
						}
					}
				}
				.bg {
					position: absolute;
					top: 37px;
					left: 0;
					bottom: 0;
					width: 100%;
					background: #F5F6F7;
					div {
						width: 125px;
						height: 125px;
						margin: 138px auto 0;
						@include retinize('tab');
					}
					span {
						display: block;
						margin-top: 16px;
						font-size: 14px;
						color: #999;
						text-align: center;
						padding: 0 10px;
					}
				}
				.chathistory{
					.bg{
						z-index: -1;
						height: 460px;
						div{
							margin: 245px auto 0;
						}
					}
				}
				.no-data {
					position: absolute;
					top: 37px;
					left: 0;
					bottom: 0;
					width: 100%;
					background: #fff;
					z-index: 1;
					div {
						width: 135px;
						height: 105px;
						margin: 106px auto 0;
						@include retinize('nodata');
					}
					span {
						display: block;
						margin-top: 16px;
						font-size: 14px;
						color: #999;
						text-align: center;
						i {
							color: #2E87FF;
						}
					}
				}
				.loading {
					display: flex;
					justify-content: center;
					align-items: center;
					position: absolute;
					top: 0;
					left: 0;
					bottom: 0;
					width: 100%;
					background: #fff;
					opacity: 0.8;
					z-index: 1;
				}
			}
			.isactive{
				background: #E6E6E6 !important;
			}
			.addFriend, .selectUser {
				/deep/ .ant-modal-header {
					background-color: #F1F2F5;
					border-bottom: none;
					padding: 14px 24px;
					/deep/ .ant-modal-title {
						color: $black;
						font-size: 16px;
						font-weight: 400;
					}
				}
				/deep/ .ant-modal-body {
					padding: 40px 30px;
					/deep/ .ant-input {
						color: $black;
						font-size: 14px;
					}
				}
				/deep/ .ant-modal-footer {
					border-top: none;
					padding: 0 30px 30px;
				}
				&.selectUser {
					/deep/ .ant-modal-body {
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
		}
	}
	.selectuseres{
		/deep/ .panel-body{
			.left{
				.left-bottom{
					padding: 15px!important;
				}
			}
		}
	}
</style>
